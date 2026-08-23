"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import Spinner from "@/components/ui/Spinner";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, member, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !member?.isAdmin) router.replace("/");
  }, [loading, user, member, router]);

  if (loading || !user || !member?.isAdmin) return <Spinner />;
  return <>{children}</>;
}
