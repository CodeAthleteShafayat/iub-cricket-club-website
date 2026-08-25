import { auth } from "@/lib/firebase/client";

async function authedPost<T>(path: string, body: unknown): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in");

  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

// Lives here rather than in members.ts because, like the email routes, it
// needs the Admin SDK server-side (to delete the Firebase Auth user).
export function deleteMemberCompletely(uid: string) {
  return authedPost<{ deleted: boolean; authDeleted: boolean }>(
    "/api/admin/delete-member",
    { uid }
  );
}

export function sendWelcomeEmail(uid: string) {
  return authedPost<{ sent: boolean; reason?: string }>(
    "/api/admin/send-welcome-email",
    { uid }
  );
}

export function sendBulkEmail(input: {
  subject: string;
  bodyText: string;
  recipientUids: string[];
}) {
  return authedPost<{
    campaignId: string;
    totalRecipients: number;
    sentCount: number;
    status: "sending" | "completed";
  }>("/api/admin/send-email", input);
}
