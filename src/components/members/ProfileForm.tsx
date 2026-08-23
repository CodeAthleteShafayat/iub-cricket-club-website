"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { updateOwnProfile } from "@/lib/services/members";
import { transformImage, uploadImage } from "@/lib/services/cloudinary";
import { ROLE_OPTIONS, DEPARTMENTS } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  studentId: z.string().min(3, "Student ID is required"),
  department: z.string().min(1, "Select a department"),
  batch: z.string().min(1, "Batch is required"),
  role: z.enum(["batsman", "bowler", "all-rounder", "wicketkeeper"]),
  phone: z.string().min(6, "Phone number is required"),
});

type FormValues = z.infer<typeof schema>;

export default function ProfileForm() {
  const { user, member } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: member
      ? {
          name: member.name,
          studentId: member.studentId,
          department: member.department,
          batch: member.batch,
          role: member.role,
          phone: member.phone,
        }
      : undefined,
  });

  if (!user || !member) return null;

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      let photoURL = member!.photoURL;
      if (photoFile) {
        photoURL = await uploadImage(photoFile, "profile-photos");
      }
      await updateOwnProfile(user!.uid, { ...values, photoURL });
      setSaved(true);
      setPhotoFile(null);
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const displayedPhoto = photoPreview ?? member.photoURL;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-navy/5">
          {displayedPhoto && (
            // eslint-disable-next-line @next/next/no-img-element -- preview can be a local blob: URL
            <img
              src={transformImage(displayedPhoto, { width: 128, height: 128 })}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <label className="text-sm">
          <span className="block font-medium text-navy">Profile photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPhotoFile(file);
              setPhotoPreview(file ? URL.createObjectURL(file) : null);
            }}
            className="mt-1 text-xs"
          />
        </label>
      </div>

      <Field label="Full name" error={errors.name?.message}>
        <input className="input" {...register("name")} />
      </Field>

      <Field label="Student ID" error={errors.studentId?.message}>
        <input className="input" {...register("studentId")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Department" error={errors.department?.message}>
          <select className="input" {...register("department")}>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Batch" error={errors.batch?.message}>
          <input className="input" {...register("batch")} />
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

      <div className="text-sm text-muted">
        Email: {member.email} (not editable)
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Profile updated.</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary mt-2 w-full sm:w-fit"
      >
        {saving ? "Saving..." : "Save changes"}
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
