import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  announcementEmailHtml,
  reserveEmailQuota,
  sendMail,
} from "@/lib/server/mailer";
import { MAX_EMAILS_PER_RUN } from "@/lib/constants";
import type { EmailCampaign, EmailCampaignRecipient, Member } from "@/lib/types";

// Server-only. Creates the campaign doc and Firestore is the queue: each
// recipient starts with sentAt: null, and processCampaignBatch drains it --
// once now (from the API route) and once a day thereafter (from the cron
// route) until every recipient has been sent to.

export async function createCampaign({
  subject,
  bodyText,
  recipientUids,
  createdBy,
}: {
  subject: string;
  bodyText: string;
  recipientUids: string[];
  createdBy: string;
}): Promise<string> {
  const adminDb = getAdminDb();
  const uniqueUids = Array.from(new Set(recipientUids));
  const memberSnaps = await Promise.all(
    uniqueUids.map((uid) => adminDb.collection("members").doc(uid).get())
  );

  // Never trust client-supplied emails/names -- resolve them server-side, and
  // only ever mail members who are actually approved right now.
  const recipients: EmailCampaignRecipient[] = memberSnaps
    .map((snap) => snap.data() as Member | undefined)
    .filter((m): m is Member => !!m && m.status === "approved")
    .map((m) => ({ uid: m.uid, email: m.email, name: m.name, sentAt: null }));

  if (recipients.length === 0) {
    throw new Error("No valid approved recipients were selected");
  }

  const ref = await adminDb.collection("emailCampaigns").add({
    subject,
    bodyText,
    createdBy,
    createdAt: FieldValue.serverTimestamp(),
    status: "sending",
    totalRecipients: recipients.length,
    sentCount: 0,
    recipients,
  });

  return ref.id;
}

// Sends to as many unsent recipients as today's shared quota allows, updates
// the campaign doc, and flips status to "completed" once everyone's done.
// Returns how many were actually sent in this call.
export async function processCampaignBatch(campaignId: string): Promise<number> {
  const ref = getAdminDb().collection("emailCampaigns").doc(campaignId);
  const snap = await ref.get();
  const campaign = snap.data() as EmailCampaign | undefined;
  if (!campaign || campaign.status === "completed") return 0;

  const pending = campaign.recipients.filter((r) => r.sentAt === null);
  if (pending.length === 0) {
    await ref.update({ status: "completed" });
    return 0;
  }

  // Never reserve more than one invocation can actually get through before
  // the function times out -- reserved-but-unsent would burn quota for
  // emails nobody received.
  const allowed = await reserveEmailQuota(
    Math.min(pending.length, MAX_EMAILS_PER_RUN)
  );
  if (allowed === 0) return 0;

  const batch = pending.slice(0, allowed);
  const html = announcementEmailHtml(campaign.subject, campaign.bodyText);

  // Sequential: the transporter is pooled and rate-limited, so awaiting one
  // at a time keeps the send rate steady rather than dumping the whole batch
  // into Gmail's connection queue at once.
  const sentUids = new Set<string>();
  for (const r of batch) {
    try {
      await sendMail({ to: r.email, subject: campaign.subject, html });
      sentUids.add(r.uid);
    } catch (error) {
      console.error(`Campaign ${campaignId}: send to ${r.email} failed`, error);
    }
  }

  const nowMs = Date.now();
  const updatedRecipients = campaign.recipients.map((r) =>
    sentUids.has(r.uid) ? { ...r, sentAt: nowMs } : r
  );
  const sentCount = updatedRecipients.filter((r) => r.sentAt !== null).length;

  await ref.update({
    recipients: updatedRecipients,
    sentCount,
    status: sentCount === campaign.totalRecipients ? "completed" : "sending",
  });

  return sentUids.size;
}

// Called by the daily cron job -- drains every in-progress campaign in
// creation order (oldest first), stopping once the shared daily quota runs
// out (reserveEmailQuota inside processCampaignBatch enforces that).
export async function processAllPendingCampaigns(): Promise<
  { campaignId: string; sent: number }[]
> {
  const pendingSnap = await getAdminDb()
    .collection("emailCampaigns")
    .where("status", "==", "sending")
    .orderBy("createdAt", "asc")
    .get();

  const results: { campaignId: string; sent: number }[] = [];
  for (const doc of pendingSnap.docs) {
    const sent = await processCampaignBatch(doc.id);
    results.push({ campaignId: doc.id, sent });
  }
  return results;
}
