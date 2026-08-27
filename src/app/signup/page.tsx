import type { Metadata } from "next";
import SignupForm from "@/components/members/SignupForm";

// Indexed on purpose, unlike the other auth screens: this is the club's
// recruitment landing page, and "join IUB cricket club" is exactly the kind
// of query it should answer.
export const metadata: Metadata = {
  title: "Join the Club",
  description:
    "Apply to join the IUB Cricket Club at Independent University, Bangladesh. Open to IUB students of every skill level — submit your application for admin review.",
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "Join the IUB Cricket Club",
    description:
      "Apply to join the IUB Cricket Club at Independent University, Bangladesh. Open to IUB students of every skill level.",
    url: "/signup",
  },
};


export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-surface px-4 py-12 sm:px-6">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <span className="section-eyebrow mb-4">Membership</span>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          Join the Club
        </h1>
        <p className="mt-2 text-sm text-muted">
          Submit your details below. An admin will review your application
          before your membership is activated.
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
