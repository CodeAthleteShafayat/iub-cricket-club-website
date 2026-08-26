"use client";

import { useEffect, useState } from "react";
import { getMatch, subscribeToMatches } from "@/lib/services/matches";
import Spinner from "@/components/ui/Spinner";
import MatchForm from "@/components/tournaments/MatchForm";
import type { Match } from "@/lib/types";

export default function EditMatchForm({ matchId }: { matchId: string }) {
  // undefined = loading, null = not found
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  const [allMatches, setAllMatches] = useState<Match[]>([]);

  useEffect(() => {
    getMatch(matchId).then(setMatch).catch(() => setMatch(null));
  }, [matchId]);

  useEffect(() => subscribeToMatches(setAllMatches), []);

  if (match === undefined) return <Spinner />;
  if (match === null) return <p className="text-sm text-muted">Match not found.</p>;

  return (
    <MatchForm
      existingMatch={match}
      knownTeams={allMatches.flatMap((m) => [m.teamA, m.teamB])}
    />
  );
}
