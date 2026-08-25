"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";
import { sendBulkEmail } from "@/lib/services/adminEmail";
import { subscribeToEmailCampaigns } from "@/lib/services/emailCampaigns";
import { DAILY_EMAIL_LIMIT, SEMESTER_OPTIONS } from "@/lib/constants";
import { formatBst } from "@/lib/utils/bst";
import type { EmailCampaign, Member, Semester } from "@/lib/types";

const DAILY_LIMIT = DAILY_EMAIL_LIMIT;

export default function ComposeEmailPanel({
  approvedMembers,
}: {
  approvedMembers: Member[];
}) {
  const [seasonFilter, setSeasonFilter] = useState<"all" | Semester>("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [excludedUids, setExcludedUids] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);

  useEffect(() => subscribeToEmailCampaigns(setCampaigns), []);

  const years = useMemo(
    () =>
      Array.from(
        new Set(approvedMembers.map((m) => m.recruitmentYear).filter((y): y is string => !!y))
      ).sort((a, b) => b.localeCompare(a)),
    [approvedMembers]
  );

  const departments = useMemo(
    () => Array.from(new Set(approvedMembers.map((m) => m.department))).sort(),
    [approvedMembers]
  );

  const filtered = useMemo(
    () =>
      approvedMembers.filter((m) => {
        if (seasonFilter !== "all" && m.recruitmentSeason !== seasonFilter) return false;
        if (yearFilter !== "all" && m.recruitmentYear !== yearFilter) return false;
        if (departmentFilter !== "all" && m.department !== departmentFilter) return false;
        return true;
      }),
    [approvedMembers, seasonFilter, yearFilter, departmentFilter]
  );

  const selected = filtered.filter((m) => !excludedUids.has(m.uid));

  function toggle(uid: string) {
    setExcludedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleSend() {
    setError(null);
    setResult(null);
    if (selected.length === 0) {
      setError("Select at least one recipient");
      return;
    }
    if (!subject.trim() || !bodyText.trim()) {
      setError("Subject and message are both required");
      return;
    }
    setSending(true);
    try {
      const res = await sendBulkEmail({
        subject,
        bodyText,
        recipientUids: selected.map((m) => m.uid),
      });
      setResult(
        res.status === "completed"
          ? `Sent to all ${res.totalRecipients} recipients.`
          : `Sent to ${res.sentCount} of ${res.totalRecipients} so far. The rest will go out automatically, ${DAILY_LIMIT}/day.`
      );
      setSubject("");
      setBodyText("");
      setExcludedUids(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Mail size={18} className="text-navy" />
        <h2 className="text-lg font-semibold text-navy">Send announcement email</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          className="input text-sm"
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value as "all" | Semester)}
        >
          <option value="all">All seasons</option>
          {SEMESTER_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input text-sm"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          <option value="all">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className="input text-sm"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
        {filtered.length === 0 && (
          <p className="p-3 text-sm text-muted">No approved members match this filter.</p>
        )}
        {filtered.map((m) => (
          <label
            key={m.uid}
            className="flex items-center gap-2.5 border-b border-border px-3 py-2 text-sm last:border-b-0 hover:bg-surface"
          >
            <input
              type="checkbox"
              checked={!excludedUids.has(m.uid)}
              onChange={() => toggle(m.uid)}
            />
            <span className="text-navy">{m.name}</span>
            <span className="text-muted">
              {m.department} · {m.recruitmentSeason ?? "—"} {m.recruitmentYear ?? ""}
            </span>
          </label>
        ))}
      </div>

      <p className="text-sm text-muted">
        {selected.length} of {filtered.length} recipient{filtered.length === 1 ? "" : "s"} selected
        {selected.length > DAILY_LIMIT &&
          ` — will send in batches of ${DAILY_LIMIT}/day (~${Math.ceil(
            selected.length / DAILY_LIMIT
          )} days to finish)`}
        .
      </p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Subject</span>
        <input
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Practice schedule for next week"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Message</span>
        <textarea
          className="input min-h-32 resize-y"
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Write your announcement..."
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && <p className="text-sm text-green-700">{result}</p>}

      <button
        onClick={handleSend}
        disabled={sending}
        className="btn-primary w-fit"
      >
        {sending ? "Sending..." : `Send to ${selected.length}`}
      </button>

      {campaigns.length > 0 && (
        <div className="mt-2 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-navy">Recent campaigns</h3>
          <div className="mt-2 flex flex-col gap-2">
            {campaigns.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 truncate text-navy">{c.subject}</div>
                <div className="shrink-0 text-muted">
                  {c.sentCount}/{c.totalRecipients} ·{" "}
                  <span className={c.status === "completed" ? "text-green-700" : "text-gold-dark"}>
                    {c.status === "completed" ? "Completed" : "Sending"}
                  </span>{" "}
                  · {formatBst(c.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
