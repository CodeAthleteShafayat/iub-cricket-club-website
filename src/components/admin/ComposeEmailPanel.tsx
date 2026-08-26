"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Clock, Mail } from "lucide-react";
import { sendBulkEmail } from "@/lib/services/adminEmail";
import { subscribeToEmailCampaigns } from "@/lib/services/emailCampaigns";
import { DAILY_EMAIL_LIMIT, IUB_EMAIL_DOMAIN, SEMESTER_OPTIONS } from "@/lib/constants";
import { formatBst } from "@/lib/utils/bst";
import type { EmailCampaign, Member, Semester } from "@/lib/types";

const DAILY_LIMIT = DAILY_EMAIL_LIMIT;

/** Why an address can't be mailed, or null when it's fine. Checked in the UI
 *  so a bad row is visible *before* sending rather than silently failing
 *  mid-campaign. The server re-checks independently. */
function emailProblem(email: string | undefined | null): string | null {
  if (!email || !email.trim()) return "No email address on file";
  const value = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Not a valid email address";
  if (!value.toLowerCase().endsWith(`@${IUB_EMAIL_DOMAIN}`)) {
    return `Not an @${IUB_EMAIL_DOMAIN} address`;
  }
  return null;
}

type SendState =
  | { kind: "none" }
  | { kind: "sent"; at: number }
  | { kind: "queued" };

/** Most recent campaign outcome per member, so the list can show a green tick
 *  for "already delivered" and a clock for "queued for a later batch". */
function buildSendStates(campaigns: EmailCampaign[]): Map<string, SendState> {
  const states = new Map<string, SendState>();
  // Campaigns arrive newest-first; the first hit for a uid is its latest.
  for (const campaign of campaigns) {
    for (const r of campaign.recipients ?? []) {
      if (states.has(r.uid)) continue;
      states.set(r.uid, r.sentAt ? { kind: "sent", at: r.sentAt } : { kind: "queued" });
    }
  }
  return states;
}

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

  const sendStates = useMemo(() => buildSendStates(campaigns), [campaigns]);

  // A row with a bad address is never selectable -- excluding it here (rather
  // than only warning) means the count and the Send button reflect what will
  // actually be attempted.
  const invalidCount = filtered.filter((m) => emailProblem(m.email)).length;
  const selected = filtered.filter(
    (m) => !excludedUids.has(m.uid) && !emailProblem(m.email)
  );

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

      <div className="max-h-72 overflow-auto rounded-lg border border-border">
        {filtered.length === 0 ? (
          <p className="p-3 text-sm text-muted">No approved members match this filter.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="w-10 px-3 py-2 font-semibold" />
                <th scope="col" className="px-3 py-2 font-semibold">Name</th>
                <th scope="col" className="px-3 py-2 font-semibold">Email</th>
                <th scope="col" className="px-3 py-2 font-semibold">Department</th>
                <th scope="col" className="px-3 py-2 font-semibold">Cohort</th>
                <th scope="col" className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const problem = emailProblem(m.email);
                const state = sendStates.get(m.uid);
                return (
                  <tr
                    key={m.uid}
                    className={`border-t border-border align-middle ${
                      problem
                        ? "border-l-4 border-l-red-500 bg-red-50"
                        : "hover:bg-surface"
                    }`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label={`Include ${m.name}`}
                        disabled={!!problem}
                        checked={!problem && !excludedUids.has(m.uid)}
                        onChange={() => toggle(m.uid)}
                        className="disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-navy">{m.name}</td>
                    <td
                      className={`px-3 py-2 ${
                        problem ? "font-medium text-red-700" : "text-muted"
                      }`}
                    >
                      {m.email || <span className="italic">missing</span>}
                    </td>
                    <td className="px-3 py-2 text-muted">{m.department}</td>
                    <td className="px-3 py-2 text-muted">
                      {m.recruitmentSeason ?? "—"} {m.recruitmentYear ?? ""}
                    </td>
                    <td className="px-3 py-2">
                      {problem ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                          <AlertTriangle size={13} /> {problem}
                        </span>
                      ) : state?.kind === "sent" ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700"
                          title={`Last sent ${formatBst(state.at)}`}
                        >
                          <Check size={13} /> Sent
                        </span>
                      ) : state?.kind === "queued" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-dark">
                          <Clock size={13} /> Queued
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-sm text-muted">
        {selected.length} of {filtered.length} recipient{filtered.length === 1 ? "" : "s"} selected
        {invalidCount > 0 && (
          <span className="font-medium text-red-700">
            {" "}
            ({invalidCount} excluded for a bad address)
          </span>
        )}
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
