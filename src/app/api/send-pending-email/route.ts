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

    const snap = await getAdminDb().collection("members").doc(uid).get();
    const member = snap.data() as Member | undefined;
    if (!member || member.status !== "pending") {
      return NextResponse.json(
        { error: "Not a pending applicant" },
        { status: 400 }
      );
    }

    const allowed = await reserveEmailQuota(1);
    if (allowed === 0) {
      return NextResponse.json({ sent: false, reason: "Daily email limit reached" });
    }

    await sendMail({
      to: member.email,
      subject: "We've received your IUB Cricket Club application",
      html: pendingEmailHtml(member.name),
    });

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("send-pending-email failed:", error);
    return NextResponse.json({ sent: false, reason: "Could not send email" });
  }
}
