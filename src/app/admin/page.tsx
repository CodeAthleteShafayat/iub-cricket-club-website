"use client";

import { useEffect, useState } from "react";
import { Clock, ShieldCheck, Users } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth/AuthContext";
import { approveMember, rejectMember, subscribeToAllMembers } from "@/lib/services/members";
import { isWindowOpen, subscribeToRecruitmentWindow } from "@/lib/services/recruitment";
import type { Member, RecruitmentWindow } from "@/lib/types";
import MemberReviewCard from "@/components/admin/MemberReviewCard";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [recruitmentWindow, setRecruitmentWindow] = useState<RecruitmentWindow | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  useEffect(() => subscribeToAllMembers(setMembers), []);
  useEffect(() => subscribeToRecruitmentWindow(setRecruitmentWindow), []);

  const windowOpen = isWindowOpen(recruitmentWindow);
  const pending = members.filter((m) => m.status === "pending");
  const pendingCount = pending.length;
  const approvedCount = members.filter((m) => m.status === "approved").length;

  async function handleApprove(uid: string) {
    if (!user) return;
    setApproveError(null);
    try {
      await approveMember(uid, user.uid);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === "permission-denied") {
        setApproveError("Recruitment window is closed");
      } else if (error instanceof Error) {
        setApproveError(error.message);
      } else {
        setApproveError("Could not approve this applicant. Please try again.");
      }
    }
  }

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
          label="Total applications"
          value={members.length}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy">
          Pending Applications ({pending.length})
        </h2>
        {!windowOpen && (
          <p className="mt-2 text-sm text-muted">
            Recruitment window is closed &mdash; open one on the Members page to approve
            applicants.
          </p>
        )}
        {approveError && <p className="mt-2 text-sm text-red-600">{approveError}</p>}
        <div className="mt-4 flex flex-col gap-3">
          {pending.length === 0 && (
            <p className="text-sm text-muted">No pending applications.</p>
          )}
          {pending.map((m) => (
            <MemberReviewCard
              key={m.uid}
              member={m}
              windowOpen={windowOpen}
              onApprove={() => handleApprove(m.uid)}
              onReject={() => user && rejectMember(m.uid, user.uid)}
            />
          ))}
        </div>
      </section>
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
