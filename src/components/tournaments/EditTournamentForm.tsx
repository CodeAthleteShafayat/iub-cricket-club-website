"use client";

import { useEffect, useState } from "react";
import { getTournament } from "@/lib/services/tournaments";
import Spinner from "@/components/ui/Spinner";
import TournamentForm from "@/components/tournaments/TournamentForm";
import type { Tournament } from "@/lib/types";

export default function EditTournamentForm({ tournamentId }: { tournamentId: string }) {
  // undefined = loading, null = not found
  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);

  useEffect(() => {
    getTournament(tournamentId).then(setTournament).catch(() => setTournament(null));
  }, [tournamentId]);

  if (tournament === undefined) return <Spinner />;
  if (tournament === null) return <p className="text-sm text-muted">Tournament not found.</p>;

  return <TournamentForm existingTournament={tournament} />;
}
