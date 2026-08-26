"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { clearMatchResult, saveMatchResult } from "@/lib/services/matches";
import {
  ballsFromOversInput,
  formatOvers,
  suggestResultText,
} from "@/lib/cricket/standings";
import type { Match } from "@/lib/types";

// Overs are typed the way a scorer says them ("16.2" = 16 overs and 2 balls),
// then converted to a legal-ball integer on save. ballsFromOversInput rejects a
// ball part of 6 or more, since the over would have ended.
const oversField = z
  .string()
  .min(1, "Overs are required")
  .refine((v) => ballsFromOversInput(v) !== null, "Use a format like 16.2 (max .5)");

const inningsFields = {
  runs: z.coerce.number().int("Whole runs only").min(0).max(2000),
  wickets: z.coerce.number().int().min(0).max(10),
  overs: oversField,
};

const schema = z.object({
  aRuns: inningsFields.runs,
  aWickets: inningsFields.wickets,
  aOvers: inningsFields.overs,
  bRuns: inningsFields.runs,
  bWickets: inningsFields.wickets,
  bOvers: inningsFields.overs,
  outcome: z.enum(["A", "B", "tie", "no-result"]),
  status: z.enum(["completed", "abandoned"]),
  resultText: z.string().max(200).optional(),
});

type FormValues = z.input<typeof schema>;

export default function MatchResultForm({ match }: { match: Match }) {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      aRuns: match.inningsA?.runs ?? 0,
      aWickets: match.inningsA?.wickets ?? 0,
      aOvers: match.inningsA ? formatOvers(match.inningsA.balls) : "",
      bRuns: match.inningsB?.runs ?? 0,
      bWickets: match.inningsB?.wickets ?? 0,
      bOvers: match.inningsB ? formatOvers(match.inningsB.balls) : "",
      outcome: match.outcome ?? "A",
      status: match.status === "abandoned" ? "abandoned" : "completed",
      resultText: match.resultText ?? "",
    },
  });

  // useWatch rather than watch(): it's the subscription-based API, and the
  // plain watch() function can't be memoized safely by the React Compiler.
  const values = useWatch({ control });

  // Live preview of the result line, so the admin can see what the public page
  // will say before committing.
  const suggestion = useMemo(() => {
    const aBalls = ballsFromOversInput(String(values.aOvers ?? ""));
    const bBalls = ballsFromOversInput(String(values.bOvers ?? ""));
    if (aBalls === null || bBalls === null) return "";
    return suggestResultText({
      ...match,
      outcome: values.outcome as Match["outcome"],
      inningsA: { runs: Number(values.aRuns) || 0, wickets: Number(values.aWickets) || 0, balls: aBalls },
      inningsB: { runs: Number(values.bRuns) || 0, wickets: Number(values.bWickets) || 0, balls: bBalls },
    });
  }, [values, match]);

  // Deliberately no auto-prefill effect here: reading the field back inside an
  // effect to decide whether to overwrite it fights with the user's own typing.
  // Instead the "Use suggested" button applies it explicitly, and onSubmit falls
  // back to the suggestion when the field was left empty.

  async function onSubmit(raw: FormValues) {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const v = schema.parse(raw);
      const aBalls = ballsFromOversInput(v.aOvers)!;
      const bBalls = ballsFromOversInput(v.bOvers)!;

      await saveMatchResult(match.id, {
        inningsA: { runs: v.aRuns, wickets: v.aWickets, balls: aBalls },
        inningsB: { runs: v.bRuns, wickets: v.bWickets, balls: bBalls },
        outcome: v.outcome,
        resultText: (v.resultText || suggestion || "").trim(),
        status: v.status,
        updatedBy: user.uid,
      });
      router.push("/admin/matches");
    } catch {
      setError("Could not save the result. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    if (!user) return;
    if (!confirm("Clear this result and set the match back to scheduled?")) return;
    setClearing(true);
    try {
      await clearMatchResult(match.id, user.uid);
      router.push("/admin/matches");
    } catch {
      setError("Could not clear the result. Please try again.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <p className="rounded-lg bg-surface px-3 py-2.5 text-sm text-muted">
        {match.teamA} <span className="font-medium">vs</span> {match.teamB} ·{" "}
        {match.oversPerInnings} overs per innings
      </p>

      <InningsFieldset
        legend={`${match.teamA} innings`}
        runs={register("aRuns")}
        wickets={register("aWickets")}
        overs={register("aOvers")}
        errors={{
          runs: errors.aRuns?.message,
          wickets: errors.aWickets?.message,
          overs: errors.aOvers?.message,
        }}
      />

      <InningsFieldset
        legend={`${match.teamB} innings`}
        runs={register("bRuns")}
        wickets={register("bWickets")}
        overs={register("bOvers")}
        errors={{
          runs: errors.bRuns?.message,
          wickets: errors.bWickets?.message,
          overs: errors.bOvers?.message,
        }}
      />

      <p className="-mt-2 text-xs text-muted">
        A team bowled out (10 wickets) is charged the full {match.oversPerInnings} overs in net run
        rate, whatever the overs faced. Enter the overs actually bowled; the calculation handles it.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Result" error={errors.outcome?.message}>
          <select className="input" {...register("outcome")}>
            <option value="A">{match.teamA} won</option>
            <option value="B">{match.teamB} won</option>
            <option value="tie">Match tied</option>
            <option value="no-result">No result</option>
          </select>
        </Field>
        <Field label="Match status" error={errors.status?.message}>
          <select className="input" {...register("status")}>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Abandoned and no-result matches still count as played and award tie points, but are left out
        of net run rate.
      </p>

      <Field label="Result line shown publicly" error={errors.resultText?.message}>
        <input className="input" {...register("resultText")} />
        {suggestion && (
          <button
            type="button"
            onClick={() => setValue("resultText", suggestion)}
            className="mt-1 self-start text-xs font-medium text-navy underline"
          >
            Use suggested: {suggestion}
          </button>
        )}
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-fit">
          {saving ? "Saving..." : "Save result"}
        </button>
        {match.status !== "scheduled" && (
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="btn-outline w-full sm:w-fit"
          >
            {clearing ? "Clearing..." : "Clear result"}
          </button>
        )}
      </div>
    </form>
  );
}

function InningsFieldset({
  legend,
  runs,
  wickets,
  overs,
  errors,
}: {
  legend: string;
  runs: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  wickets: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  overs: ReturnType<ReturnType<typeof useForm<FormValues>>["register"]>;
  errors: { runs?: string; wickets?: string; overs?: string };
}) {
  return (
    <fieldset className="rounded-xl border border-border p-4">
      <legend className="px-1.5 text-sm font-semibold text-navy">{legend}</legend>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Runs" error={errors.runs}>
          <input className="input" type="number" min={0} {...runs} />
        </Field>
        <Field label="Wickets" error={errors.wickets}>
          <input className="input" type="number" min={0} max={10} {...wickets} />
        </Field>
        <Field label="Overs" error={errors.overs}>
          <input className="input" placeholder="16.2" {...overs} />
        </Field>
      </div>
    </fieldset>
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
