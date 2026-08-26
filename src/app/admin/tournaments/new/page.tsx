import TournamentForm from "@/components/tournaments/TournamentForm";

export default function NewTournamentPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">New Tournament</h1>
      <div className="card mt-6 p-5 sm:p-6">
        <TournamentForm />
      </div>
    </div>
  );
}
