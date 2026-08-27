import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/members/LoginForm";

export const metadata: Metadata = {
  title: "Log In",
  robots: { index: false, follow: false },
};


export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-surface px-4 py-12 sm:px-6">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <span className="section-eyebrow mb-4">Membership</span>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          Log In
        </h1>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-sm text-muted">
          Not a member yet?{" "}
          <Link href="/signup" className="font-medium text-navy underline">
            Apply here
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
