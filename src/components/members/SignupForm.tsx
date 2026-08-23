"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase/client";
import { createMemberDoc } from "@/lib/services/members";
import { ROLE_OPTIONS, DEPARTMENTS } from "@/lib/constants";
import { useAuth } from "@/lib/auth/AuthContext";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  studentId: z.string().min(3, "Student ID is required"),
  department: z.string().min(1, "Select a department"),
  batch: z.string().min(1, "Batch is required"),
  role: z.enum(["batsman", "bowler", "all-rounder", "wicketkeeper"]),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignupForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && user) router.replace("/profile");
  }, [loading, user, router]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
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
        batch: values.batch,
        role: values.role,
        phone: values.phone,
        email: values.email,
      });
      router.push("/pending-approval");
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "auth/email-already-in-use") {
        setSubmitError("An account with this email already exists.");
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Full name" error={errors.name?.message}>
        <input className="input" {...register("name")} />
      </Field>

      <Field label="Student ID" error={errors.studentId?.message}>
        <input className="input" {...register("studentId")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Department" error={errors.department?.message}>
          <select className="input" {...register("department")} defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Batch" error={errors.batch?.message}>
          <input className="input" placeholder="e.g. 48" {...register("batch")} />
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
      </Field>

      <Field label="Password" error={errors.password?.message}>
        <input className="input" type="password" {...register("password")} />
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
