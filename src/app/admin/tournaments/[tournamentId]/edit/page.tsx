import EditTournamentForm from "@/components/tournaments/EditTournamentForm";

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Edit Tournament</h1>
      <div className="card mt-6 p-5 sm:p-6">
        <EditTournamentForm tournamentId={tournamentId} />
      </div>
    </div>
  );
}
