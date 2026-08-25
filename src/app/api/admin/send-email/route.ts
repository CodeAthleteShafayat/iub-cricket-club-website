import { NextResponse } from "next/server";
import { AdminAuthError, requireAdmin } from "@/lib/auth/requireAdmin";
import { createCampaign, processCampaignBatch } from "@/lib/server/campaigns";
import { getAdminDb } from "@/lib/firebase/admin";
import type { EmailCampaign } from "@/lib/types";

const MAX_RECIPIENTS = 2000;

// Sending is paced (see mailer.ts), so a full batch takes tens of seconds.
// 60s is the ceiling on Vercel's Hobby plan; raise it on Pro if MAX_EMAILS_PER_RUN grows.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { uid } = await requireAdmin(request);

    const { subject, bodyText, recipientUids } = await request.json();

    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (typeof bodyText !== "string" || !bodyText.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }
    if (
      !Array.isArray(recipientUids) ||
      recipientUids.length === 0 ||
      !recipientUids.every((v) => typeof v === "string")
    ) {
      return NextResponse.json({ error: "Select at least one recipient" }, { status: 400 });
    }
    if (recipientUids.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients (max ${MAX_RECIPIENTS})` },
        { status: 400 }
      );
    }

    const campaignId = await createCampaign({
      subject: subject.trim(),
      bodyText: bodyText.trim(),
      recipientUids,
      createdBy: uid,
    });

    await processCampaignBatch(campaignId);

    const snap = await getAdminDb().collection("emailCampaigns").doc(campaignId).get();
    const campaign = snap.data() as EmailCampaign;

    return NextResponse.json({
      campaignId,
      totalRecipients: campaign.totalRecipients,
      sentCount: campaign.sentCount,
      status: campaign.status,
    });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("send-email failed:", error);
    const message = error instanceof Error ? error.message : "Could not send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
