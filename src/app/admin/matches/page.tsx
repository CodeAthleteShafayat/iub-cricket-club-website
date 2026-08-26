"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { deleteMatch, subscribeToMatches } from "@/lib/services/matches";
import { subscribeToTournaments } from "@/lib/services/tournaments";
import { formatInnings } from "@/lib/cricket/standings";
import { toJsDate } from "@/lib/utils/bst";
import type { Match, Tournament } from "@/lib/types";

function formatWhen(value: unknown): string {
  const date = toJsDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToMatches(setMatches, {
        onError: () => setError("Could not load matches."),
      }),
    []
  );
  useEffect(() => subscribeToTournaments(setTournaments), []);

  const tournamentName = useMemo(() => {
    const map = new Map(tournaments.map((t) => [t.id, t.name]));
    return (id: string | null) => (id ? map.get(id) ?? "Unknown tournament" : "Friendly");
  }, [tournaments]);

  const visible = useMemo(() => {
    if (filter === "all") return matches;
    if (filter === "none") return matches.filter((m) => !m.tournamentId);
    return matches.filter((m) => m.tournamentId === filter);
  }, [matches, filter]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Matches</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="input !py-2 text-sm sm:w-56"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All tournaments</option>
            <option value="none">Friendlies only</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Link href="/admin/matches/new" className="btn-primary w-full sm:w-fit">
            <Plus size={16} /> Add match
          </Link>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-sm text-muted">No matches yet.</p>}
        {visible.map((m) => (
          <div key={m.id} className="card flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-medium text-navy">
                {m.teamA} <span className="text-muted">vs</span> {m.teamB}
              </div>
              <div className="text-muted">
                {formatWhen(m.startAt)} · {tournamentName(m.tournamentId)}
              </div>
              {m.status === "completed" && m.inningsA && m.inningsB && (
                <div className="mt-1 text-xs text-muted">
                  {formatInnings(m.teamA, m.inningsA)} · {formatInnings(m.teamB, m.inningsB)}
                </div>
              )}
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  m.status === "completed"
                    ? "bg-green-50 text-green-800"
                    : m.status === "abandoned"
                      ? "bg-surface text-muted"
                      : "border border-border text-navy"
                }`}
              >
                {m.status}
              </span>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href={`/admin/matches/${m.id}/result`}
                className="flex items-center gap-1 font-medium text-navy hover:underline"
              >
                <ClipboardList size={14} />
                {m.status === "scheduled" ? "Add result" : "Edit result"}
              </Link>
              <Link
                href={`/admin/matches/${m.id}/edit`}
                className="flex items-center gap-1 font-medium text-navy hover:underline"
              >
                <Pencil size={14} /> Edit
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Delete ${m.teamA} vs ${m.teamB}? This cannot be undone.`)) {
                    deleteMatch(m.id);
                  }
                }}
                className="flex items-center gap-1 font-medium text-red-600 hover:underline"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
