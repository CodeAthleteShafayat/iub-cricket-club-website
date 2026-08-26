"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { getTournament } from "@/lib/services/tournaments";
import { subscribeToMatches } from "@/lib/services/matches";
import { transformImage } from "@/lib/services/cloudinary";
import { computeStandingsByGroup, knockoutMatches } from "@/lib/cricket/standings";
import Spinner from "@/components/ui/Spinner";
import FixtureRow from "@/components/tournaments/FixtureRow";
import StandingsTable from "@/components/tournaments/StandingsTable";
import type { Match, Tournament } from "@/lib/types";

type Tab = "fixtures" | "results" | "table";

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    if (!y || !m || !day) return d;
    return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };
  if (!startDate) return "";
  if (!endDate || endDate === startDate) return fmt(startDate);
  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

export default function TournamentDetail({ tournamentId }: { tournamentId: string }) {
  // undefined = still loading, null = not found (same idiom as PostDetail)
  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("fixtures");

  useEffect(() => {
    getTournament(tournamentId).then(setTournament).catch(() => setTournament(null));
  }, [tournamentId]);

  useEffect(() => {
    return subscribeToMatches(setMatches, {
      tournamentId,
      onError: () =>
        setError("Could not load matches. Please refresh in a moment."),
    });
  }, [tournamentId]);

  const upcoming = useMemo(
    () => matches.filter((m) => m.status === "scheduled"),
    [matches]
  );
  const finished = useMemo(
    () =>
      matches
        .filter((m) => m.status === "completed" || m.status === "abandoned")
        // Fixtures read oldest-first; results are more useful newest-first.
        .slice()
        .reverse(),
    [matches]
  );
  const groupTables = useMemo(
    () => (tournament ? computeStandingsByGroup(matches, tournament) : []),
    [matches, tournament]
  );
  const knockouts = useMemo(
    () => (tournament ? knockoutMatches(matches, tournament) : []),
    [matches, tournament]
  );

  if (tournament === undefined) return <Spinner />;
  if (tournament === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm text-muted">Tournament not found.</p>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "fixtures", label: "Fixtures", count: upcoming.length },
    { id: "results", label: "Results", count: finished.length },
    { id: "table", label: "Points table" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {tournament.imageURL && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
        <img
          src={transformImage(tournament.imageURL, { width: 1200, crop: "limit" })}
          alt=""
          className="mb-6 w-full rounded-xl"
        />
      )}

      <h1 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
        {tournament.name}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={14} />
          {formatDateRange(tournament.startDate, tournament.endDate)}
        </span>
        {tournament.venue && (
          <span className="flex items-center gap-1.5">
            <MapPin size={14} /> {tournament.venue}
          </span>
        )}
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold capitalize text-navy">
          {tournament.status}
        </span>
      </div>

      {tournament.description && (
        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-foreground/80">
          {tournament.description}
        </p>
      )}

      <nav className="mt-8 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-3 py-2.5 text-sm font-medium transition ${
              tab === t.id ? "text-navy" : "text-muted hover:text-navy"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 text-xs text-muted">({t.count})</span>
            )}
            {tab === t.id && (
              <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-gold" />
            )}
          </button>
        ))}
      </nav>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-col gap-3">
        {tab === "fixtures" &&
          (upcoming.length === 0 ? (
            <p className="text-sm text-muted">No upcoming matches scheduled.</p>
          ) : (
            upcoming.map((m) => <FixtureRow key={m.id} match={m} />)
          ))}

        {tab === "results" &&
          (finished.length === 0 ? (
            <p className="text-sm text-muted">No results yet.</p>
          ) : (
            finished.map((m) => <FixtureRow key={m.id} match={m} />)
          ))}

        {tab === "table" && (
          <div className="flex flex-col gap-8">
            {groupTables.map((table) => (
              <div key={table.group ?? "all"}>
                {table.group && (
                  <h3 className="mb-2.5 font-heading text-sm font-semibold text-navy">
                    {table.group}
                  </h3>
                )}
                <StandingsTable rows={table.rows} />
              </div>
            ))}

            {knockouts.length > 0 && (
              <div>
                <h3 className="mb-2.5 font-heading text-sm font-semibold text-navy">
                  Knockout stage
                </h3>
                <p className="mb-3 text-xs text-muted">
                  These sit outside the group stage and don&apos;t affect the tables above.
                </p>
                <div className="flex flex-col gap-3">
                  {knockouts.map((m) => (
                    <FixtureRow key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
