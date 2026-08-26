import NewMatchForm from "@/components/tournaments/NewMatchForm";

export default function NewMatchPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Add Match</h1>
      <div className="card mt-6 p-5 sm:p-6">
        <NewMatchForm />
      </div>
    </div>
  );
}
