import TournamentDetail from "@/components/tournaments/TournamentDetail";

// Next 16: dynamic params are a Promise and must be awaited in the server
// component before being handed to the client component.
export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return <TournamentDetail tournamentId={tournamentId} />;
}
