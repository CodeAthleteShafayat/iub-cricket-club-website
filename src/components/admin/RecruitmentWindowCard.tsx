"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  isWindowOpen,
  setRecruitmentWindow,
  subscribeToRecruitmentWindow,
} from "@/lib/services/recruitment";
import {
  bstDateToDatetimeLocalValue,
  datetimeLocalToBstDate,
  formatBst,
  toJsDate,
} from "@/lib/utils/bst";
import { SEMESTER_OPTIONS } from "@/lib/constants";
import type { RecruitmentWindow } from "@/lib/types";

const schema = z
  .object({
    season: z.enum(["Spring", "Summer", "Autumn"], { message: "Select a season" }),
    year: z.string().regex(/^\d{4}$/, "Enter a 4-digit year"),
    startAt: z.string().min(1, "Start date/time is required"),
    endAt: z.string().min(1, "End date/time is required"),
  })
  .refine((v) => datetimeLocalToBstDate(v.endAt) > datetimeLocalToBstDate(v.startAt), {
    message: "End must be after start",
    path: ["endAt"],
  });

type FormValues = z.infer<typeof schema>;

export default function RecruitmentWindowCard() {
  const { user } = useAuth();
  const [currentWindow, setCurrentWindow] = useState<RecruitmentWindow | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => subscribeToRecruitmentWindow(setCurrentWindow), []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!currentWindow) return;
    const start = toJsDate(currentWindow.startAt);
    const end = toJsDate(currentWindow.endAt);
    if (!start || !end) return;
    reset({
      season: currentWindow.season,
      year: currentWindow.year,
      startAt: bstDateToDatetimeLocalValue(start),
      endAt: bstDateToDatetimeLocalValue(end),
    });
  }, [currentWindow, reset]);

  const open = isWindowOpen(currentWindow, now);

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSubmitError(null);
    try {
      await setRecruitmentWindow({
        season: values.season,
        year: values.year,
        startAt: datetimeLocalToBstDate(values.startAt),
        endAt: datetimeLocalToBstDate(values.endAt),
        adminUid: user.uid,
      });
    } catch {
      setSubmitError("Could not save the recruitment window. Please try again.");
    }
  }

  return (
    <section className="card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy">Recruitment Window</h2>
        <StatusPill window={currentWindow} open={open} />
      </div>
      <p className="text-sm text-muted">
        Applicants can only be approved into full members while a window is open. Times are in
        Bangladesh Standard Time.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Field label="Season" error={errors.season?.message}>
          <select className="input" {...register("season")} defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {SEMESTER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Year" error={errors.year?.message}>
          <input className="input" placeholder="e.g. 2026" {...register("year")} />
        </Field>

        <Field label="Start (Bangladesh time)" error={errors.startAt?.message}>
          <input className="input" type="datetime-local" {...register("startAt")} />
        </Field>

        <Field label="End (Bangladesh time)" error={errors.endAt?.message}>
          <input className="input" type="datetime-local" {...register("endAt")} />
        </Field>

        <div className="sm:col-span-2 lg:col-span-4">
          {submitError && <p className="mb-2 text-sm text-red-600">{submitError}</p>}
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving..." : "Save recruitment window"}
          </button>
        </div>
      </form>
    </section>
  );
}

function StatusPill({
  window: recruitmentWindow,
  open,
}: {
  window: RecruitmentWindow | null;
  open: boolean;
}) {
  if (!recruitmentWindow) {
    return (
      <span className="rounded bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted">
        Not configured yet
      </span>
    );
  }
  if (open) {
    return (
      <span className="rounded bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        Open until {formatBst(recruitmentWindow.endAt)} BST
      </span>
    );
  }
  return (
    <span className="rounded bg-gold/20 px-2.5 py-1 text-xs font-medium text-gold-dark">
      Closed &mdash; opens {formatBst(recruitmentWindow.startAt)} BST
    </span>
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
