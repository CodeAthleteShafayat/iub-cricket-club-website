"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteTournament, subscribeToTournaments } from "@/lib/services/tournaments";
import type { Tournament } from "@/lib/types";

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToTournaments(setTournaments, () =>
        setError("Could not load tournaments.")
      ),
    []
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Tournaments</h1>
        <Link href="/admin/tournaments/new" className="btn-primary w-full sm:w-fit">
          <Plus size={16} /> New tournament
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {tournaments.length === 0 && (
          <p className="text-sm text-muted">No tournaments yet.</p>
        )}
        {tournaments.map((t) => (
          <div
            key={t.id}
            className="card flex items-center justify-between gap-3 p-4 text-sm"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-navy">{t.name}</div>
              <div className="text-muted">
                {t.startDate} · {t.oversPerInnings} overs ·{" "}
                <span className="capitalize">{t.status}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                href={`/admin/tournaments/${t.id}/edit`}
                className="flex items-center gap-1 font-medium text-navy hover:underline"
              >
                <Pencil size={14} /> Edit
              </Link>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Delete "${t.name}"? This cannot be undone. Its matches are kept but will no longer appear under any tournament.`
                    )
                  ) {
                    deleteTournament(t.id);
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
