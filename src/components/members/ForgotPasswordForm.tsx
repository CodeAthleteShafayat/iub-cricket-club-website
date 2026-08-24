"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

const COOLDOWN_MS = 60_000;
const COOLDOWN_STORAGE_KEY = "forgotPasswordCooldownUntil";

function getCooldownRemaining() {
  try {
    const until = Number(localStorage.getItem(COOLDOWN_STORAGE_KEY));
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

export default function ForgotPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldownMs, setCooldownMs] = useState(getCooldownRemaining);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const interval = setInterval(() => setCooldownMs(getCooldownRemaining()), 1000);
    return () => clearInterval(interval);
  }, []);

  const onCooldown = cooldownMs > 0;
  const cooldownSeconds = Math.ceil(cooldownMs / 1000);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setSent(true);
    } catch {
      setSubmitError("Could not send reset email. Check the address and try again.");
    } finally {
      try {
        localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now() + COOLDOWN_MS));
      } catch {
        // localStorage unavailable (e.g. private browsing) — cooldown just won't persist
      }
      setCooldownMs(COOLDOWN_MS);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-navy">
          If an account exists for that email, a password reset link has been sent.
          Check your inbox (and spam folder).
        </p>
        {onCooldown && (
          <p className="text-xs text-muted">
            You can request another link in {cooldownSeconds}s.
          </p>
        )}
      </div>
    );
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

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      {onCooldown && (
        <p className="text-xs text-muted">
          Please wait {cooldownSeconds}s before requesting another link.
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || onCooldown}
        className="btn-primary mt-2 w-full"
      >
        {isSubmitting ? "Sending..." : onCooldown ? `Wait ${cooldownSeconds}s` : "Send reset link"}
      </button>
    </form>
  );
}
