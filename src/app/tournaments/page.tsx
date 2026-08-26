"use client";

import { useEffect, useState } from "react";
import { subscribeToTournaments } from "@/lib/services/tournaments";
import { subscribeToFriendlies } from "@/lib/services/matches";
import PageHeader from "@/components/ui/PageHeader";
import TournamentCard from "@/components/tournaments/TournamentCard";
import FixtureRow from "@/components/tournaments/FixtureRow";
import type { Match, Tournament, TournamentStatus } from "@/lib/types";

const GROUPS: { status: TournamentStatus; label: string }[] = [
  { status: "ongoing", label: "Happening now" },
  { status: "upcoming", label: "Upcoming" },
  { status: "completed", label: "Past tournaments" },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [friendlies, setFriendlies] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToTournaments(
      (list) => {
        setTournaments(list);
        setLoading(false);
      },
      () => {
        setError("Could not load tournaments. Please refresh in a moment.");
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => subscribeToFriendlies(setFriendlies), []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <PageHeader
        title="Tournaments"
        description="Fixtures, results, and points tables for the tournaments we play in."
      />

      {loading && <p className="text-sm text-muted">Loading tournaments...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && tournaments.length === 0 && friendlies.length === 0 && (
        <p className="text-sm text-muted">No tournaments have been added yet.</p>
      )}

      <div className="flex flex-col gap-12">
        {GROUPS.map((group) => {
          const inGroup = tournaments.filter((t) => t.status === group.status);
          if (inGroup.length === 0) return null;
          return (
            <section key={group.status}>
              <h2 className="section-eyebrow mb-4">{group.label}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {inGroup.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </section>
          );
        })}

        {friendlies.length > 0 && (
          <section>
            <h2 className="section-eyebrow mb-4">Friendlies &amp; other matches</h2>
            <div className="flex flex-col gap-3">
              {/* Upcoming first (the query sorts ascending), then played ones. */}
              {[...friendlies]
                .sort((a, b) => {
                  const rank = (m: Match) => (m.status === "scheduled" ? 0 : 1);
                  return rank(a) - rank(b);
                })
                .map((m) => (
                  <FixtureRow key={m.id} match={m} />
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
