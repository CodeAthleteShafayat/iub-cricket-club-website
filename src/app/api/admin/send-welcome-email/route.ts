import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase/admin";
import { reserveEmailQuota, sendMail, welcomeEmailHtml } from "@/lib/server/mailer";
import type { Member } from "@/lib/types";

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const { uid } = await request.json();
    if (typeof uid !== "string" || !uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const snap = await getAdminDb().collection("members").doc(uid).get();
    const member = snap.data() as Member | undefined;
    if (!member || member.status !== "approved") {
      return NextResponse.json(
        { error: "Member is not approved" },
        { status: 400 }
      );
    }

    const allowed = await reserveEmailQuota(1);
    if (allowed === 0) {
      return NextResponse.json({ sent: false, reason: "Daily email limit reached" });
    }

    await sendMail({
      to: member.email,
      subject: "Welcome to the IUB Cricket Club!",
      html: welcomeEmailHtml(member.name),
    });

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("send-welcome-email failed:", error);
    return NextResponse.json({ sent: false, reason: "Could not send email" });
  }
}
