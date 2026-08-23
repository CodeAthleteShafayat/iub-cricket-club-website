"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  approveMember,
  rejectMember,
  subscribeToAllMembers,
} from "@/lib/services/members";
import type { Member } from "@/lib/types";
import MemberReviewCard from "@/components/admin/MemberReviewCard";
import { downloadCsv, membersToCsv } from "@/lib/utils/csv";

export default function AdminMembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => subscribeToAllMembers(setMembers), []);

  const pending = members.filter((m) => m.status === "pending");
  const others = members.filter((m) => m.status !== "pending");

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`iub-cricket-club-members-${date}.csv`, membersToCsv(members));
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {members.length} total member{members.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={handleExport}
          disabled={members.length === 0}
          className="btn-outline !px-4 !py-2 text-sm"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-navy">
          Pending Applications ({pending.length})
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {pending.length === 0 && (
            <p className="text-sm text-muted">No pending applications.</p>
          )}
          {pending.map((m) => (
            <MemberReviewCard
              key={m.uid}
              member={m}
              onApprove={() => user && approveMember(m.uid, user.uid)}
              onReject={() => user && rejectMember(m.uid, user.uid)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-navy">
          All Members ({others.length})
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {others.map((m) => (
            <div key={m.uid} className="card flex items-center justify-between p-4 text-sm">
              <div>
                <div className="font-medium text-navy">
                  {m.name}
                  {m.isAdmin && (
                    <span className="ml-2 rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold-dark">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-muted">
                  {m.email} · {m.department} · {m.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
