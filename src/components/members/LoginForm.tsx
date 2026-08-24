"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/");
    } catch {
      setSubmitError("Invalid email or password.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Email</span>
        <input className="input" type="email" {...register("email")} />
        {errors.email && (
          <span className="text-xs text-red-600">{errors.email.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Password</span>
        <input className="input" type="password" {...register("password")} />
        {errors.password && (
          <span className="text-xs text-red-600">
            {errors.password.message}
          </span>
        )}
      </label>

      <Link
        href="/forgot-password"
        className="-mt-2 self-end text-xs font-medium text-navy underline"
      >
        Forgot password?
      </Link>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full">
        {isSubmitting ? "Signing in..." : "Log in"}
      </button>
    </form>
  );
}
