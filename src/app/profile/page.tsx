import ApprovedGuard from "@/components/auth/ApprovedGuard";
import ProfileForm from "@/components/members/ProfileForm";

export default function ProfilePage() {
  return (
    <ApprovedGuard>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <span className="section-eyebrow mb-4">Account</span>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          My Profile
        </h1>
        <div className="card mt-6 p-5 sm:p-6">
          <ProfileForm />
        </div>
      </div>
    </ApprovedGuard>
  );
}
