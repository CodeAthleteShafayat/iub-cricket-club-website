"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import Spinner from "@/components/ui/Spinner";

export default function ApprovedGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, member, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!member || member.status !== "approved") {
      router.replace("/pending-approval");
    }
  }, [loading, user, member, router]);

  if (loading || !user || !member || member.status !== "approved") {
    return <Spinner />;
  }
  return <>{children}</>;
}
