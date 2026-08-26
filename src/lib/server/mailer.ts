import nodemailer from "nodemailer";
import { getAdminDb } from "@/lib/firebase/admin";
import { DAILY_EMAIL_LIMIT, SOCIAL_LINKS } from "@/lib/constants";

// Server-only: pulls in nodemailer and the Gmail App Password. Never import
// this from a client component or "use client" file.

export { DAILY_EMAIL_LIMIT };

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.OFFICE_MAIL;
  const pass = process.env.MAIL_APP_PASSORD;
  if (!user || !pass) {
    throw new Error(
      "OFFICE_MAIL / MAIL_APP_PASSORD are not set in .env.local"
    );
  }
  // Deliberately NOT pooled. Pooling is a long-lived-process optimization --
  // it keeps a persistent SMTP connection open to reuse across many sends.
  // On Vercel, every invocation is a fresh, short-lived process with nothing
  // to reuse a pool across, and the open connection can outlive the
  // function's response and hang the request instead of ever resolving
  // (reproduced locally: a pooled send never completed, a plain one took
  // ~4s). The actual pacing goal -- not blasting Gmail with a burst -- is
  // already handled by processCampaignBatch awaiting one send at a time
  // rather than firing them concurrently, so pooling added risk with no
  // corresponding benefit here.
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Atomically reserves up to `count` sends against today's shared quota --
// welcome emails and bulk-campaign batches all draw from the same pool, since
// the real constraint is the mailbox's daily send volume, not any one
// feature. Returns how many of the requested sends were actually granted (0
// if today is already full; the rest waits for tomorrow's batch).
export async function reserveEmailQuota(count: number): Promise<number> {
  if (count <= 0) return 0;
  const adminDb = getAdminDb();
  const ref = adminDb.collection("emailQuota").doc(todayKey());
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.data()?.count as number | undefined) ?? 0;
    const allowed = Math.max(0, Math.min(count, DAILY_EMAIL_LIMIT - used));
    if (allowed > 0) {
      tx.set(ref, { count: used + allowed }, { merge: true });
    }
    return allowed;
  });
}

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await getTransporter().sendMail({
    from: `"IUB Cricket Club" <${process.env.OFFICE_MAIL}>`,
    to,
    subject,
    html,
  });
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emailShell(bodyHtml: string) {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;background:#faf7f0;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e6ded0;">
      <div style="background:#0b1e3d;padding:24px 28px;">
        <div style="font-size:18px;font-weight:700;color:#ffffff;">IUB Cricket Club</div>
        <div style="font-size:11px;letter-spacing:0.1em;color:#e6c369;text-transform:uppercase;margin-top:2px;">Independent University, Bangladesh</div>
      </div>
      <div style="padding:28px;color:#0e1b34;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px;background:#f2ecdd;color:#6b6558;font-size:12px;">
        <div style="margin-bottom:8px;">
          <a href="${SOCIAL_LINKS.facebook}" style="color:#8f6b1c;text-decoration:none;font-weight:600;">Facebook</a>
          <span style="color:#c4bcae;padding:0 6px;">&middot;</span>
          <a href="${SOCIAL_LINKS.instagram}" style="color:#8f6b1c;text-decoration:none;font-weight:600;">Instagram</a>
        </div>
        IUB Cricket Club &middot; sent to you as a registered member.
      </div>
    </div>
  </div>`;
}

// Vercel sets these automatically on every deployment -- no manual env var
// needed. VERCEL_PROJECT_PRODUCTION_URL is the stable production domain
// (correct even behind a custom domain); NEXT_PUBLIC_SITE_URL remains as a
// manual override for local testing or non-Vercel hosting.
function getSiteUrl(): string | null {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return null;
}

// Two side-by-side buttons pointing at the club's actual social pages --
// deliberately the primary call to action in these emails rather than a link
// back into the site, since a brand-new applicant/member gets more value
// from the club's live Facebook/Instagram content than from their own mostly-
// empty profile page.
function socialButtonsHtml() {
  return `<p style="margin:0 0 16px;">
    <a href="${SOCIAL_LINKS.facebook}" style="display:inline-block;background:#0b1e3d;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:6px;margin-right:8px;">Follow on Facebook</a>
    <a href="${SOCIAL_LINKS.instagram}" style="display:inline-block;background:#c99a2e;color:#0b1e3d;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:6px;">Follow on Instagram</a>
  </p>`;
}

export function welcomeEmailHtml(name: string) {
  const siteUrl = getSiteUrl();
  return emailShell(`
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Congratulations! Your application to join the <strong>IUB Cricket Club</strong> has been approved, and you are now officially a member.</p>
    <p style="margin:0 0 12px;">Here's what that means:</p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      <li style="margin-bottom:6px;">You now have access to the members' <strong>Community</strong> board to chat with the rest of the squad.</li>
      <li style="margin-bottom:6px;">Check the <strong>News</strong> page regularly for practice schedules, match fixtures, and tournament announcements.</li>
      <li style="margin-bottom:6px;">Your name is now on the official club roster.</li>
      <li>Keep your profile details up to date so teammates and admins can reach you.</li>
    </ul>
    <p style="margin:0 0 12px;">Stay connected with the club for the latest updates and photos:</p>
    ${socialButtonsHtml()}
    ${
      siteUrl
        ? `<p style="margin:0 0 16px;font-size:13px;"><a href="${siteUrl}/profile" style="color:#8f6b1c;">View your profile &rarr;</a></p>`
        : ""
    }
    <p style="margin:0;">See you on the field!</p>
  `);
}

export function pendingEmailHtml(name: string) {
  return emailShell(`
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Thanks for applying to the <strong>IUB Cricket Club</strong>! We've received your application and it's now in front of our admins for review.</p>
    <p style="margin:0 0 16px;">You don't need to do anything else right now. As soon as an admin approves your application, we'll send you another email confirming you're officially a member.</p>
    <p style="margin:0 0 12px;">In the meantime, follow us on social media so you don't miss any club news:</p>
    ${socialButtonsHtml()}
    <p style="margin:0;">Thanks for your patience!</p>
  `);
}

export function announcementEmailHtml(subject: string, bodyText: string) {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
  return emailShell(`
    <h1 style="margin:0 0 16px;font-size:18px;color:#0b1e3d;">${escapeHtml(subject)}</h1>
    ${paragraphs}
  `);
}
