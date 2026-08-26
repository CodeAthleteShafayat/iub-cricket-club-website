"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { createTournament, updateTournament } from "@/lib/services/tournaments";
import { transformImage, uploadImage } from "@/lib/services/cloudinary";
import type { Tournament } from "@/lib/types";

const schema = z
  .object({
    name: z.string().min(2, "Name is required"),
    description: z.string().max(2000, "Keep it under 2000 characters").optional(),
    venue: z.string().max(120).optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z.enum(["upcoming", "ongoing", "completed"]),
    oversPerInnings: z.coerce
      .number()
      .int("Whole overs only")
      .min(1, "Must be at least 1")
      .max(60, "Must be 60 or fewer"),
    pointsForWin: z.coerce.number().int().min(0).max(20),
    pointsForTie: z.coerce.number().int().min(0).max(20),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "End date can't be before the start date",
    path: ["endDate"],
  });

type FormValues = z.input<typeof schema>;

export default function TournamentForm({
  existingTournament,
}: {
  existingTournament?: Tournament;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingTournament
      ? {
          name: existingTournament.name,
          description: existingTournament.description,
          venue: existingTournament.venue,
          startDate: existingTournament.startDate,
          endDate: existingTournament.endDate,
          status: existingTournament.status,
          oversPerInnings: existingTournament.oversPerInnings,
          pointsForWin: existingTournament.pointsForWin,
          pointsForTie: existingTournament.pointsForTie,
        }
      : {
          status: "upcoming",
          oversPerInnings: 20,
          pointsForWin: 2,
          pointsForTie: 1,
        },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      let imageURL = existingTournament?.imageURL ?? null;
      if (imageFile) imageURL = await uploadImage(imageFile, "tournaments");

      const parsed = schema.parse(values);
      const payload = {
        name: parsed.name,
        description: parsed.description ?? "",
        venue: parsed.venue ?? "",
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        status: parsed.status,
        oversPerInnings: parsed.oversPerInnings,
        pointsForWin: parsed.pointsForWin,
        pointsForTie: parsed.pointsForTie,
        imageURL,
      };

      if (existingTournament) {
        await updateTournament(existingTournament.id, payload);
      } else {
        await createTournament({ ...payload, createdBy: user.uid });
      }
      router.push("/admin/tournaments");
    } catch {
      setError("Could not save the tournament. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Tournament name" error={errors.name?.message}>
        <input className="input" placeholder="e.g. ULAB Fair Play Cup 2025" {...register("name")} />
      </Field>

      <Field label="Description (optional)" error={errors.description?.message}>
        <textarea className="input" rows={3} {...register("description")} />
      </Field>

      <Field label="Venue (optional)" error={errors.venue?.message}>
        <input className="input" {...register("venue")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date" error={errors.startDate?.message}>
          <input className="input" type="date" {...register("startDate")} />
        </Field>
        <Field label="End date" error={errors.endDate?.message}>
          <input className="input" type="date" {...register("endDate")} />
        </Field>
      </div>

      <Field label="Status" error={errors.status?.message}>
        <select className="input" {...register("status")}>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Happening now</option>
          <option value="completed">Completed</option>
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Overs per innings" error={errors.oversPerInnings?.message}>
          <input className="input" type="number" min={1} max={60} {...register("oversPerInnings")} />
        </Field>
        <Field label="Points for a win" error={errors.pointsForWin?.message}>
          <input className="input" type="number" min={0} max={20} {...register("pointsForWin")} />
        </Field>
        <Field label="Points for a tie" error={errors.pointsForTie?.message}>
          <input className="input" type="number" min={0} max={20} {...register("pointsForTie")} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Overs per innings is also the full quota charged in net run rate when a team is bowled out.
        Tie points are also awarded for an abandoned or no-result match.
      </p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Banner image (optional)</span>
        {existingTournament?.imageURL && !imageFile && (
          // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
          <img
            src={transformImage(existingTournament.imageURL, { width: 400 })}
            alt=""
            className="mb-1 w-40 rounded-lg"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary mt-2 w-full sm:w-fit">
        {saving ? "Saving..." : existingTournament ? "Update tournament" : "Create tournament"}
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
