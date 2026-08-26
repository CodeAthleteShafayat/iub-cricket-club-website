"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Award,
  Calendar,
  Camera,
  Droplet,
  GraduationCap,
  Hash,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { updateOwnProfile } from "@/lib/services/members";
import { formatBst } from "@/lib/utils/bst";
import type { Member } from "@/lib/types";
import {
  PROFILE_PHOTO_MAX_DIMENSION,
  transformImage,
  uploadImage,
} from "@/lib/services/cloudinary";
import {
  ROLE_OPTIONS,
  SEMESTER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  PLAYING_EXPERIENCE_OPTIONS,
} from "@/lib/constants";
import DepartmentAutocomplete from "@/components/members/DepartmentAutocomplete";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  studentId: z.string().min(3, "Student ID is required"),
  department: z.string().min(1, "Select a department"),
  semester: z.enum(["Spring", "Summer", "Autumn"], { message: "Select a semester" }),
  year: z.string().regex(/^\d{4}$/, "Enter a 4-digit year"),
  role: z.enum(["batsman", "bowler", "all-rounder", "wicketkeeper"]),
  phone: z.string().min(6, "Phone number is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((v) => new Date(v) <= new Date(), "Date of birth can't be in the future"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
    message: "Select your blood group",
  }),
  playingExperience: z.enum(
    ["none", "school", "college", "university", "club", "professional"],
    { message: "Select your playing experience" }
  ),
  cricketingAchievements: z
    .string()
    .max(500, "Keep it under 500 characters")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileForm() {
  const { user, member } = useAuth();
  const [editing, setEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: member
      ? {
          name: member.name,
          studentId: member.studentId,
          department: member.department,
          semester: member.semester,
          year: member.year,
          role: member.role,
          phone: member.phone,
          dateOfBirth: member.dateOfBirth ?? "",
          bloodGroup: member.bloodGroup,
          playingExperience: member.playingExperience,
          cricketingAchievements: member.cricketingAchievements ?? "",
        }
      : undefined,
  });

  if (!user || !member) return null;

  function startEditing() {
    // Reseed from the live member doc rather than the values captured when
    // this component first mounted, so an edit started after a save (or an
    // admin-side change) doesn't write back stale data.
    reset({
      name: member!.name,
      studentId: member!.studentId,
      department: member!.department,
      semester: member!.semester,
      year: member!.year,
      role: member!.role,
      phone: member!.phone,
      dateOfBirth: member!.dateOfBirth ?? "",
      bloodGroup: member!.bloodGroup,
      playingExperience: member!.playingExperience,
      cricketingAchievements: member!.cricketingAchievements ?? "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
    setSaved(false);
    setEditing(true);
  }

  function cancelEditing() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
    setEditing(false);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      let photoURL = member!.photoURL;
      if (photoFile) {
        photoURL = await uploadImage(photoFile, "profile-photos", {
          maxDimension: PROFILE_PHOTO_MAX_DIMENSION,
        });
      }
      await updateOwnProfile(user!.uid, {
        ...values,
        cricketingAchievements: values.cricketingAchievements ?? "",
        photoURL,
      });
      setSaved(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditing(false);
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const displayedPhoto = photoPreview ?? member.photoURL;

  if (!editing) {
    return (
      <ProfileView member={member} saved={saved} onEdit={startEditing} />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-surface/50 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-navy/5 ring-2 ring-gold/30">
          {displayedPhoto && (
            // eslint-disable-next-line @next/next/no-img-element -- preview can be a local blob: URL
            <img
              src={transformImage(displayedPhoto, { width: 160, height: 160 })}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <label className="text-sm">
          <span className="flex items-center gap-1.5 font-medium text-navy">
            <Camera size={14} /> Profile photo
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPhotoFile(file);
              setPhotoPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="mt-1.5 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-navy-light"
          />
          <span className="mt-1 block text-xs text-muted">
            Leave empty to keep your current photo.
          </span>
        </label>
      </div>

      <Field label="Full name" error={errors.name?.message}>
        <input className="input" {...register("name")} />
      </Field>

      <Field label="Student ID" error={errors.studentId?.message}>
        <input className="input" {...register("studentId")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Department" error={errors.department?.message}>
          <Controller
            control={control}
            name="department"
            render={({ field }) => (
              <DepartmentAutocomplete value={field.value} onChange={field.onChange} />
            )}
          />
        </Field>

        <Field label="Semester" error={errors.semester?.message}>
          <select className="input" {...register("semester")}>
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
      </div>

      <Field label="Playing role" error={errors.role?.message}>
        <select className="input" {...register("role")}>
          {ROLE_OPTIONS.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Phone number" error={errors.phone?.message}>
        <input className="input" {...register("phone")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date of birth" error={errors.dateOfBirth?.message}>
          <input className="input" type="date" {...register("dateOfBirth")} />
        </Field>

        <Field label="Blood group" error={errors.bloodGroup?.message}>
          <select className="input" {...register("bloodGroup")} defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {BLOOD_GROUP_OPTIONS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Playing experience" error={errors.playingExperience?.message}>
        <select className="input" {...register("playingExperience")} defaultValue="">
          <option value="" disabled>
            Select
          </option>
          {PLAYING_EXPERIENCE_OPTIONS.map((exp) => (
            <option key={exp.value} value={exp.value}>
              {exp.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Cricketing achievements (optional)"
        error={errors.cricketingAchievements?.message}
      >
        <textarea
          className="input"
          rows={3}
          placeholder="e.g. district-level trophy, school captain, notable performances"
          {...register("cricketingAchievements")}
        />
      </Field>

      <div className="flex items-center gap-2 rounded-lg bg-surface/60 px-3 py-2.5 text-sm text-muted">
        <Mail size={14} className="shrink-0" />
        <span>{member.email}</span>
        <span className="ml-auto text-xs">Can&apos;t be changed</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row">
        <button
          type="button"
          onClick={cancelEditing}
          disabled={saving}
          className="btn-outline w-full sm:w-fit"
        >
          <X size={16} /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full sm:w-fit"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function formatDateOfBirth(value: string | undefined | null): string {
  if (!value) return "Not set";
  // Stored as a plain YYYY-MM-DD string, not a timestamp -- parse the parts
  // directly so the browser's timezone can't shift it to the previous day.
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ProfileView({
  member,
  saved,
  onEdit,
}: {
  member: Member;
  saved: boolean;
  onEdit: () => void;
}) {
  const roleLabel =
    ROLE_OPTIONS.find((r) => r.value === member.role)?.label ?? member.role;
  const experienceLabel =
    PLAYING_EXPERIENCE_OPTIONS.find((e) => e.value === member.playingExperience)
      ?.label ?? "Not set";

  return (
    <div className="flex flex-col gap-6">
      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-800">
          Profile updated.
        </p>
      )}

      {/* Identity header */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-navy/5 ring-2 ring-gold/40">
          {member.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
            <img
              src={transformImage(member.photoURL, { width: 192, height: 192 })}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-xl font-bold tracking-tight text-navy">
            {member.name}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-navy px-2.5 py-1 text-xs font-semibold text-white">
              {roleLabel}
            </span>
            {member.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-xs font-semibold text-gold-dark">
                <ShieldCheck size={12} /> Admin
              </span>
            )}
            {member.recruitmentSeason && (
              <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted">
                {member.recruitmentSeason} {member.recruitmentYear}
              </span>
            )}
          </div>
          {member.reviewedAt && (
            <p className="mt-2 text-xs text-muted">
              Member since {formatBst(member.reviewedAt)}
            </p>
          )}
        </div>
        <button onClick={onEdit} className="btn-primary w-full shrink-0 sm:w-fit">
          <Pencil size={15} /> Edit profile
        </button>
      </div>

      <span className="seam opacity-40" />

      <DetailSection title="Academic">
        <DetailRow icon={<Hash size={14} />} label="Student ID" value={member.studentId} />
        <DetailRow
          icon={<GraduationCap size={14} />}
          label="Department"
          value={member.department}
        />
        <DetailRow
          icon={<Calendar size={14} />}
          label="Semester"
          value={`${member.semester} ${member.year}`}
        />
      </DetailSection>

      <DetailSection title="Cricket">
        <DetailRow icon={<Award size={14} />} label="Playing role" value={roleLabel} />
        <DetailRow
          icon={<Trophy size={14} />}
          label="Experience"
          value={experienceLabel}
        />
        <DetailRow
          icon={<Trophy size={14} />}
          label="Achievements"
          value={member.cricketingAchievements?.trim() || "None listed"}
        />
      </DetailSection>

      <DetailSection title="Personal &amp; contact">
        <DetailRow
          icon={<Calendar size={14} />}
          label="Date of birth"
          value={formatDateOfBirth(member.dateOfBirth)}
        />
        <DetailRow
          icon={<Droplet size={14} />}
          label="Blood group"
          value={member.bloodGroup ?? "Not set"}
        />
        <DetailRow icon={<Phone size={14} />} label="Phone" value={member.phone} />
        <DetailRow icon={<Mail size={14} />} label="Email" value={member.email} />
      </DetailSection>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-heading text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-gold-dark">
        {title}
      </h3>
      <dl className="mt-2.5 divide-y divide-border overflow-hidden rounded-xl border border-border">
        {children}
      </dl>
    </section>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-3.5 py-2.5 text-sm sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="flex shrink-0 items-center gap-2 text-muted sm:w-36">
        <span className="text-gold-dark">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0 break-words font-medium text-navy">{value}</dd>
    </div>
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
