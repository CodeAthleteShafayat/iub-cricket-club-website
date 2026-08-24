import Link from "next/link";
import ForgotPasswordForm from "@/components/members/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-surface px-4 py-12 sm:px-6">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <span className="section-eyebrow mb-4">Membership</span>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          Reset Password
        </h1>
        <p className="mt-2 text-sm text-muted">
          Enter your account email and we&apos;ll send you a link to reset your password.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-sm text-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-navy underline">
            Log in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
