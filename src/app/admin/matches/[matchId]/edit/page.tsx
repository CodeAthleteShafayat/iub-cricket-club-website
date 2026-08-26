import EditMatchForm from "@/components/tournaments/EditMatchForm";

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Edit Match</h1>
      <div className="card mt-6 p-5 sm:p-6">
        <EditMatchForm matchId={matchId} />
      </div>
    </div>
  );
}
