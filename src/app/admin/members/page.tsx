"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  approveMember,
  rejectMember,
  subscribeToAllMembers,
} from "@/lib/services/members";
import { isWindowOpen, subscribeToRecruitmentWindow } from "@/lib/services/recruitment";
import { formatBst } from "@/lib/utils/bst";
import { SEMESTER_OPTIONS } from "@/lib/constants";
import type { Member, RecruitmentWindow, Semester } from "@/lib/types";
import MemberReviewCard from "@/components/admin/MemberReviewCard";
import RecruitmentWindowCard from "@/components/admin/RecruitmentWindowCard";
import { downloadCsv, membersToCsv } from "@/lib/utils/csv";

type SeasonFilter = "all" | "legacy" | Semester;

export default function AdminMembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [recruitmentWindow, setRecruitmentWindow] = useState<RecruitmentWindow | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => subscribeToAllMembers(setMembers), []);
  useEffect(() => subscribeToRecruitmentWindow(setRecruitmentWindow), []);

  const windowOpen = isWindowOpen(recruitmentWindow);
  const pending = members.filter((m) => m.status === "pending");
  const others = members.filter((m) => m.status !== "pending");

  const years = useMemo(
    () =>
      Array.from(
        new Set(others.map((m) => m.recruitmentYear).filter((y): y is string => !!y))
      ).sort((a, b) => b.localeCompare(a)),
    [others]
  );

  const filteredOthers = others.filter((m) => {
    if (seasonFilter === "legacy") return !m.recruitmentSeason;
    if (seasonFilter !== "all" && m.recruitmentSeason !== seasonFilter) return false;
    if (yearFilter !== "all" && m.recruitmentYear !== yearFilter) return false;
    return true;
  });

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`iub-cricket-club-members-${date}.csv`, membersToCsv(members));
  }

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
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {members.length} total application{members.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={handleExport}
          disabled={members.length === 0}
          className="btn-outline !px-4 !py-2 text-sm"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <RecruitmentWindowCard />

      <section>
        <h2 className="text-lg font-semibold text-navy">
          Pending Applications ({pending.length})
        </h2>
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

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">
            All Members ({filteredOthers.length}/{others.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            <select
              className="input !w-auto text-sm"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value as SeasonFilter)}
            >
              <option value="all">All seasons</option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="legacy">Not set (legacy)</option>
            </select>
            <select
              className="input !w-auto text-sm"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              disabled={seasonFilter === "legacy"}
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {filteredOthers.map((m) => (
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
                {m.status === "approved" && (
                  <div className="text-muted">
                    Recruited: {m.recruitmentSeason ?? "—"} {m.recruitmentYear ?? ""} · Became a
                    member: {formatBst(m.reviewedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
