"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase/client";
import { createMemberDoc } from "@/lib/services/members";
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
  IUB_EMAIL_DOMAIN,
} from "@/lib/constants";
import { useAuth } from "@/lib/auth/AuthContext";
import { sendPendingConfirmationEmail } from "@/lib/services/applicantEmail";
import DepartmentAutocomplete from "@/components/members/DepartmentAutocomplete";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  studentId: z.string().min(3, "Student ID is required"),
  department: z.string().min(1, "Select a department"),
  semester: z.enum(["Spring", "Summer", "Autumn"], { message: "Select a semester" }),
  year: z.string().regex(/^\d{4}$/, "Enter a 4-digit year"),
  role: z.enum(["batsman", "bowler", "all-rounder", "wicketkeeper"]),
  phone: z.string().min(6, "Phone number is required"),
  email: z
    .string()
    .email("Enter a valid email")
    .refine(
      (v) => v.toLowerCase().endsWith(`@${IUB_EMAIL_DOMAIN}`),
      `Use your IUB email address (e.g. 1234567@${IUB_EMAIL_DOMAIN})`
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

export default function SignupForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { department: "" } });

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    setPhotoError(null);
    if (!photoFile) {
      setPhotoError("A profile photo is required");
      return;
    }
    try {
      const photoURL = await uploadImage(photoFile, "profile-photos", {
        maxDimension: PROFILE_PHOTO_MAX_DIMENSION,
      });
      const credential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      await createMemberDoc({
        uid: credential.user.uid,
        name: values.name,
        studentId: values.studentId,
        department: values.department,
        semester: values.semester,
        year: values.year,
        role: values.role,
        phone: values.phone,
        email: values.email,
        photoURL,
        dateOfBirth: values.dateOfBirth,
        bloodGroup: values.bloodGroup,
        playingExperience: values.playingExperience,
        cricketingAchievements: values.cricketingAchievements ?? "",
      });
      // Membership doc is the source of truth and is already written --
      // the email is a courtesy, so a failure here shouldn't block signup.
      sendPendingConfirmationEmail().catch(() => {});
      router.push("/pending-approval");
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "auth/email-already-in-use") {
        setSubmitError("An account with this email already exists.");
      } else if (error instanceof Error && error.message === "Image upload failed") {
        setSubmitError("Could not upload your photo. Please try again.");
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-navy/5">
          {photoPreview && (
            // eslint-disable-next-line @next/next/no-img-element -- preview is a local blob: URL
            <img
              src={transformImage(photoPreview, { width: 128, height: 128 })}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <label className="text-sm">
          <span className="block font-medium text-navy">Profile photo *</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPhotoFile(file);
              setPhotoPreview(file ? URL.createObjectURL(file) : null);
              if (file) setPhotoError(null);
            }}
            className="mt-1 text-xs"
          />
          {photoError && <span className="mt-1 block text-xs text-red-600">{photoError}</span>}
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
          <select className="input" {...register("semester")} defaultValue="">
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
      </div>

      <Field label="Playing role" error={errors.role?.message}>
        <select className="input" {...register("role")} defaultValue="">
          <option value="" disabled>
            Select
          </option>
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

      <Field label="Email" error={errors.email?.message}>
        <input className="input" type="email" {...register("email")} />
        <span className="text-xs text-muted">
          (Your IUB mail, e.g. 1234567@{IUB_EMAIL_DOMAIN})
        </span>
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <input className="input" type="password" {...register("password")} />
        <span className="text-xs text-muted">
          Create a password for your IUB Cricket Club account. This is not your IUB student portal password.
        </span>
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

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary mt-2 w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit application"}
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
