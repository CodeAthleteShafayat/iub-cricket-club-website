"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Clock, XCircle } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import AuthGuard from "@/components/auth/AuthGuard";
import Spinner from "@/components/ui/Spinner";

function PendingApprovalContent() {
  const { member, loading } = useAuth();
  const router = useRouter();

  if (loading) return <Spinner />;

  const isRejected = member?.status === "rejected";

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-surface px-4 py-12 sm:px-6">
      <div className="card w-full max-w-md p-6 text-center sm:p-8">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            isRejected ? "bg-red-50 text-red-600" : "bg-gold/15 text-gold-dark"
          }`}
        >
          {isRejected ? <XCircle size={22} /> : <Clock size={22} />}
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-navy sm:text-2xl">
          {isRejected ? "Application Not Approved" : "Application Pending"}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {isRejected
            ? "Your membership application was not approved. If you believe this is a mistake, please contact a club admin."
            : "Thanks for applying! An admin needs to review and approve your membership before you get full access to your profile and the community area."}
        </p>
        <button
          onClick={async () => {
            await signOut(auth);
            router.push("/");
          }}
          className="btn-outline mt-8 w-full sm:w-auto"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <AuthGuard>
      <PendingApprovalContent />
    </AuthGuard>
  );
}
