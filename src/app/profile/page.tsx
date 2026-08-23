import ApprovedGuard from "@/components/auth/ApprovedGuard";
import ProfileForm from "@/components/members/ProfileForm";

export default function ProfilePage() {
  return (
    <ApprovedGuard>
      <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
        <span className="section-eyebrow mb-4 block" />
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          My Profile
        </h1>
        <div className="card mt-6 p-5 sm:p-6">
          <ProfileForm />
        </div>
      </div>
    </ApprovedGuard>
  );
}
