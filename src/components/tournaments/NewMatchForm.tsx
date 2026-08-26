"use client";

import { useEffect, useState } from "react";
import { subscribeToMatches } from "@/lib/services/matches";
import MatchForm from "@/components/tournaments/MatchForm";
import type { Match } from "@/lib/types";

// Collects the team names already used anywhere on the site, so MatchForm can
// offer them as suggestions. Consistent spelling matters: the points table
// groups by exact team name.
export default function NewMatchForm() {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => subscribeToMatches(setMatches), []);

  const knownTeams = matches.flatMap((m) => [m.teamA, m.teamB]);

  return <MatchForm knownTeams={knownTeams} />;
}
