import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { Member } from "@/lib/types";

export class AdminAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Verifies the caller's Firebase ID token server-side and confirms the
// corresponding member doc is really an admin. The client-side AdminGuard is
// UX only, not a security boundary — every admin-only API route must call
// this before doing anything privileged.
export async function requireAdmin(
  request: Request
): Promise<{ uid: string; member: Member }> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new AdminAuthError("Missing Authorization header", 401);

  const decoded = await getAdminAuth().verifyIdToken(token).catch(() => null);
  if (!decoded) throw new AdminAuthError("Invalid or expired token", 401);

  const snap = await getAdminDb().collection("members").doc(decoded.uid).get();
  const member = snap.data() as Member | undefined;

  if (!member || !member.isAdmin || member.status !== "approved") {
    throw new AdminAuthError("Not an admin", 403);
  }

  return { uid: decoded.uid, member };
}
