"use client";

import { useEffect, useState } from "react";
import { Clock, ShieldCheck, Users } from "lucide-react";
import { subscribeToAllMembers } from "@/lib/services/members";
import type { Member } from "@/lib/types";

export default function AdminDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => subscribeToAllMembers(setMembers), []);

  const pendingCount = members.filter((m) => m.status === "pending").length;
  const approvedCount = members.filter((m) => m.status === "approved").length;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-navy">
        Admin Dashboard
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Clock size={18} />}
          label="Pending applications"
          value={pendingCount}
        />
        <StatCard
          icon={<ShieldCheck size={18} />}
          label="Approved members"
          value={approvedCount}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Total members"
          value={members.length}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy">
        {icon}
      </span>
      <div className="mt-4 text-3xl font-bold text-navy">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}
