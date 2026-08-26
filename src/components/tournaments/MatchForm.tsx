"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { createMatch, updateMatch } from "@/lib/services/matches";
import { subscribeToTournaments } from "@/lib/services/tournaments";
import {
  bstDateToDatetimeLocalValue,
  datetimeLocalToBstDate,
  toJsDate,
} from "@/lib/utils/bst";
import type { Match, Tournament } from "@/lib/types";

const schema = z
  .object({
    tournamentId: z.string(),
    teamA: z.string().min(1, "Team is required").max(60),
    teamB: z.string().min(1, "Team is required").max(60),
    venue: z.string().max(120).optional(),
    startAt: z.string().min(1, "Date and time are required"),
    oversPerInnings: z.coerce.number().int().min(1).max(60),
  })
  .refine((v) => v.teamA.trim() !== v.teamB.trim(), {
    message: "The two teams must be different",
    path: ["teamB"],
  });

type FormValues = z.input<typeof schema>;

export default function MatchForm({
  existingMatch,
  knownTeams = [],
}: {
  existingMatch?: Match;
  knownTeams?: string[];
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToTournaments(setTournaments), []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingMatch
      ? {
          tournamentId: existingMatch.tournamentId ?? "",
          teamA: existingMatch.teamA,
          teamB: existingMatch.teamB,
          venue: existingMatch.venue,
          startAt: (() => {
            const d = toJsDate(existingMatch.startAt);
            return d ? bstDateToDatetimeLocalValue(d) : "";
          })(),
          oversPerInnings: existingMatch.oversPerInnings,
        }
      : { tournamentId: "", oversPerInnings: 20 },
  });

  // useWatch rather than watch(): subscription-based and safe to memoize.
  const selectedTournamentId = useWatch({ control, name: "tournamentId" });

  // Picking a tournament pulls in its default innings length, so the admin
  // doesn't have to remember whether this competition is T20 or 50-over.
  useEffect(() => {
    if (existingMatch) return;
    const t = tournaments.find((x) => x.id === selectedTournamentId);
    if (t) setValue("oversPerInnings", t.oversPerInnings);
  }, [selectedTournamentId, tournaments, setValue, existingMatch]);

  // Suggest team names already used, so the points table doesn't end up with
  // "ULAB" and "ULAB " as two separate rows.
  const teamSuggestions = useMemo(
    () => Array.from(new Set(knownTeams.filter(Boolean))).sort(),
    [knownTeams]
  );

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const parsed = schema.parse(values);
      const payload = {
        tournamentId: parsed.tournamentId || null,
        teamA: parsed.teamA.trim(),
        teamB: parsed.teamB.trim(),
        venue: parsed.venue?.trim() ?? "",
        // Interpreted as Bangladesh wall-clock time regardless of the admin's
        // own machine timezone -- same helper the recruitment window uses.
        startAt: datetimeLocalToBstDate(parsed.startAt),
        oversPerInnings: parsed.oversPerInnings,
      };

      if (existingMatch) {
        await updateMatch(existingMatch.id, payload);
      } else {
        await createMatch({ ...payload, updatedBy: user.uid });
      }
      router.push("/admin/matches");
    } catch {
      setError("Could not save the match. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <datalist id="team-suggestions">
        {teamSuggestions.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <Field label="Tournament" error={errors.tournamentId?.message}>
        <select className="input" {...register("tournamentId")}>
          <option value="">Standalone friendly (no tournament)</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Team A" error={errors.teamA?.message}>
          <input className="input" list="team-suggestions" {...register("teamA")} />
        </Field>
        <Field label="Team B" error={errors.teamB?.message}>
          <input className="input" list="team-suggestions" {...register("teamB")} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Team names group the points table, so spelling must match exactly between matches. Pick from
        the suggestions where you can.
      </p>

      <Field label="Date and time" error={errors.startAt?.message}>
        <input className="input" type="datetime-local" {...register("startAt")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Venue (optional)" error={errors.venue?.message}>
          <input className="input" {...register("venue")} />
        </Field>
        <Field label="Overs per innings" error={errors.oversPerInnings?.message}>
          <input className="input" type="number" min={1} max={60} {...register("oversPerInnings")} />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary mt-2 w-full sm:w-fit">
        {saving ? "Saving..." : existingMatch ? "Update match" : "Add match"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-navy">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
