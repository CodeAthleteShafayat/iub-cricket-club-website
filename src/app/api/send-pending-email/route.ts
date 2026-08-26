import { NextResponse } from "next/server";
import { AdminAuthError, verifyCaller } from "@/lib/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase/admin";
import { pendingEmailHtml, reserveEmailQuota, sendMail } from "@/lib/server/mailer";
import type { Member } from "@/lib/types";

// Not an admin route -- called by an applicant right after they submit the
// signup form, about their own new account. Deliberately outside /api/admin/:
// the authorization rule here is "you can only trigger this for yourself"
// (enforced by deriving uid from the verified token, never the request body),
// not "you must be an admin".
export async function POST(request: Request) {
  try {
    const { uid } = await verifyCaller(request);

    const db = getAdminDb();
    const memberSnap = await db.collection("members").doc(uid).get();
    const member = memberSnap.data() as Member | undefined;
    if (!member || member.status !== "pending") {
      return NextResponse.json(
        { error: "Not a pending applicant" },
        { status: 400 }
      );
    }

    // Send-once claim. Without this, a pending applicant can call this route
    // in a loop and drain the whole shared daily quota, which would silently
    // block every welcome email and bulk announcement club-wide for the rest
    // of the day. Signup is open to anyone who can produce an @iub.edu.bd
    // shaped address (Firebase never verifies the mailbox exists), so this is
    // reachable by an outsider, not just real students.
    //
    // The claim lives in its own collection rather than on the member doc:
    // firestore.rules lets a member update their own profile, and a flag
    // stored there would be clearable by the very person it restrains.
    const claimRef = db.collection("pendingEmailClaims").doc(uid);
    const claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(claimRef);
      if (snap.exists) return false;
      tx.set(claimRef, { uid, claimedAt: Date.now() });
      return true;
    });

    if (!claimed) {
      return NextResponse.json({ sent: false, reason: "Already sent" });
    }

    const allowed = await reserveEmailQuota(1);
    if (allowed === 0) {
      // Release the claim so this isn't permanently lost to a quota blip.
      await claimRef.delete().catch(() => {});
      return NextResponse.json({ sent: false, reason: "Daily email limit reached" });
    }

    try {
      await sendMail({
        to: member.email,
        subject: "We've received your IUB Cricket Club application",
        html: pendingEmailHtml(member.name),
      });
    } catch (sendError) {
      // A transient SMTP failure shouldn't cost this applicant their one
      // and only confirmation email.
      await claimRef.delete().catch(() => {});
      throw sendError;
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("send-pending-email failed:", error);
    return NextResponse.json({ sent: false, reason: "Could not send email" });
  }
}
