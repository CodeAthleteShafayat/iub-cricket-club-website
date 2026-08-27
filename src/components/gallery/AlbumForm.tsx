"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { createAlbum, updateAlbum } from "@/lib/services/albums";
import { subscribeToTournaments } from "@/lib/services/tournaments";
import type { Album, Tournament } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Name is required").max(120, "Keep it under 120 characters"),
  description: z.string().max(500, "Keep it under 500 characters").optional(),
  tournamentId: z.string(),
});

type FormValues = z.input<typeof schema>;

export default function AlbumForm({
  existingAlbum,
  onDone,
}: {
  existingAlbum?: Album;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeToTournaments(setTournaments), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingAlbum
      ? {
          name: existingAlbum.name,
          description: existingAlbum.description,
          tournamentId: existingAlbum.tournamentId ?? "",
        }
      : { name: "", description: "", tournamentId: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const v = schema.parse(values);
      const payload = {
        name: v.name.trim(),
        description: v.description?.trim() ?? "",
        tournamentId: v.tournamentId || null,
      };
      if (existingAlbum) {
        await updateAlbum(existingAlbum.id, payload);
      } else {
        await createAlbum({ ...payload, createdBy: user.uid });
      }
      onDone();
    } catch {
      setError("Could not save the album. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-4 p-5">
      <h2 className="font-heading text-lg font-semibold text-navy">
        {existingAlbum ? "Edit album" : "New album"}
      </h2>

      <Field label="Album name" error={errors.name?.message}>
        <input
          className="input"
          placeholder="e.g. ULAB Fair Play Cup 2025"
          {...register("name")}
        />
      </Field>

      <Field label="Description (optional)" error={errors.description?.message}>
        <textarea className="input" rows={2} {...register("description")} />
      </Field>

      <Field label="Link to a tournament (optional)" error={errors.tournamentId?.message}>
        <select className="input" {...register("tournamentId")}>
          <option value="">Not tournament related</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="submit" disabled={saving} className="btn-primary w-full sm:w-fit">
          {saving ? "Saving..." : existingAlbum ? "Save changes" : "Create album"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          className="btn-outline w-full sm:w-fit"
        >
          Cancel
        </button>
      </div>
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
