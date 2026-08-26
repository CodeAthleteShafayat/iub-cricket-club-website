import { auth } from "@/lib/firebase/client";

// Triggered by an applicant about their own account right after signup, not
// by an admin -- kept separate from adminEmail.ts, which wraps the
// admin-gated routes under /api/admin/.
export async function sendPendingConfirmationEmail(): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return;

  const res = await fetch("/api/send-pending-email", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
}
