"use client";

import { useEffect, useState } from "react";
import { getMatch } from "@/lib/services/matches";
import Spinner from "@/components/ui/Spinner";
import MatchResultForm from "@/components/tournaments/MatchResultForm";
import type { Match } from "@/lib/types";

export default function MatchResultLoader({ matchId }: { matchId: string }) {
  // undefined = loading, null = not found
  const [match, setMatch] = useState<Match | null | undefined>(undefined);

  useEffect(() => {
    getMatch(matchId).then(setMatch).catch(() => setMatch(null));
  }, [matchId]);

  if (match === undefined) return <Spinner />;
  if (match === null) return <p className="text-sm text-muted">Match not found.</p>;

  return <MatchResultForm match={match} />;
}
