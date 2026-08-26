import MatchResultLoader from "@/components/tournaments/MatchResultLoader";

export default async function MatchResultPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Match Result</h1>
      <p className="mt-1 text-sm text-muted">
        These figures feed the points table and net run rate.
      </p>
      <div className="card mt-6 p-5 sm:p-6">
        <MatchResultLoader matchId={matchId} />
      </div>
    </div>
  );
}
