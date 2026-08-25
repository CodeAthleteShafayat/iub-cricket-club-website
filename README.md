# IUB Cricket Club Website

Official website for the IUB Cricket Club (Independent University, Bangladesh): club info, a member signup flow with admin approval, member profiles, a news/posts feed, a community message wall, a photo gallery, and a dynamic homepage slideshow.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4, Turbopack)
- **Firebase**: Authentication (Email/Password), Cloud Firestore, Security Rules — this is the entire backend. No custom server; the app talks to Firebase directly from the client.
- **Cloudinary**: image hosting for profile photos, post images, and the gallery — used instead of Firebase Storage, which requires the paid Blaze plan. Cloudinary's free tier needs no card. Uploads go straight from the browser to Cloudinary via an unsigned upload preset; the resulting URLs are stored in Firestore (`members.photoURL`, `posts.imageURL`, `galleryImages.url`). Every display site applies a Cloudinary URL transformation (`transformImage()` in `src/lib/services/cloudinary.ts`) to resize/compress images on the fly — never render `img.url` directly, always run it through `transformImage` first, or every view downloads the full multi-MB original.

## Features

- Public pages: Home (with dynamic photo slideshow), About, Team (roster), News, Gallery, Contact
- Member self-signup → pending admin approval → full access
- Member profile (view/edit, with photo upload)
- Admin dashboard: approve/reject applicants, manage members, publish posts (with image), manage gallery, export all members as CSV
- Public news feed (posts, optional image)
- Realtime community message wall for approved members
- Gallery: admins upload photos and can star ("feature") any of them — starred photos automatically appear in a rotating slideshow on the homepage. No code changes ever needed to update the homepage slideshow; it's entirely admin-editable at `/gallery`.

## Getting started (new machine / new Firebase project)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

This app needs its own Firebase project (Authentication + Firestore). If you're continuing work on the **existing** `iub-cricket-club` Firebase project, skip to step 5 and just copy the real `.env.local` values across instead (see step 5's fallback note).

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Create a **Firestore Database** (production mode, pick a region close to your users).
4. Register a **Web App** (Project Settings → Your apps → `</>`) and copy the config values.
5. Copy `.env.example` to `.env.local` and fill in the six `NEXT_PUBLIC_FIREBASE_*` values.

### 3. Set up Cloudinary (image hosting)

1. Sign up free at [cloudinary.com](https://cloudinary.com) — no card required.
2. Note your **Cloud name** from the dashboard.
3. Settings → Upload → Upload presets → Add upload preset → set **Signing Mode** to **Unsigned** → leave "Asset folder" blank (the app sets a folder per upload type in code) → save, and note the preset name.
4. Fill in `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in `.env.local`.

### 4. Deploy security rules and indexes

Requires the Firebase CLI logged into the same Google account as the Firebase project:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <your-project-id>
```

Composite indexes can take 1–2 minutes to finish building after deploy — until then, queries that need them will fail in the browser console with `failed-precondition` (harmless, just wait and retry).

### 5. Bootstrap the first admin

1. Run the app and sign up once through `/signup` with your own account.
2. In the Firestore console, open your document under `members/{your-uid}`.
3. Manually set `status` to `"approved"` and `isAdmin` to `true`. **Watch for accidental trailing spaces** when editing string fields in the Firestore console UI (e.g. `"approved "` instead of `"approved"`) — the app does exact string matching, so a stray space silently breaks it.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin guide (day-to-day use, no code required)

- **Approve/reject members**: `/admin/members`
- **Export all members to CSV**: `/admin/members` → "Export CSV" button
- **Publish news posts**: `/admin/posts` → "New post"
- **Manage the gallery / homepage slideshow**: `/gallery` → "Add photo" to upload; click the ⭐ on any photo to feature it on the homepage (click again to un-feature); trash icon to delete

## Project structure

```
src/
  app/                 Routes (App Router) — public pages, auth, profile, community, admin/*
  components/
    home/              PhotoCarousel (generic fade carousel) + FeaturedPhotos (live Firestore-backed wrapper for the homepage)
    layout/             Navbar, Footer (both render /public/logo.png)
    auth/ members/ posts/ community/ admin/ ui/   UI grouped by feature
  lib/
    firebase/client.ts Firebase app/auth/firestore client init (no Storage — Cloudinary replaces it)
    auth/AuthContext.tsx  Auth + live member-doc state, exposed via useAuth()
    services/
      members.ts posts.ts community.ts    Firestore read/write functions
      gallery.ts                          gallery CRUD + featured-on-home query/toggle
      cloudinary.ts                       uploadImage() + transformImage() — see Tech stack note above
    utils/csv.ts        Member → CSV export (client-side only, no backend)
    types.ts            Shared TypeScript types (Member, Post, CommunityMessage, GalleryImage)
public/
  logo.png              Club logo, background removed (transparent PNG)
src/app/icon.png         Favicon (same logo)
firestore.rules          Firestore security rules (the real access-control boundary)
firestore.indexes.json   Composite indexes required by the app's queries
```

## Security model

Route guards (`AuthGuard`, `ApprovedGuard`, `AdminGuard`) are UX convenience only — they redirect signed-out/unapproved/non-admin users, but the actual access control is enforced by `firestore.rules`. Any change to permissions must be made (and redeployed) there.

## Admin email feature

Built. Two parts, both send through the same daily quota (see below):

1. **Automatic welcome email** — fires from `approveMember()` in `src/lib/services/members.ts` right after a pending applicant is approved (dashboard and `/admin/members` both go through this one function, so both are covered). Best-effort: if the email fails to send, the approval itself is unaffected — Firestore is the source of truth, the email is a courtesy.
2. **Bulk announcement email** — the `ComposeEmailPanel` on `/admin/members` lets an admin filter approved members (by recruitment season/year and department) and fine-tune with checkboxes, then send a subject + message to everyone selected.

**Architecture**: this is the one place in the app with server-side code, since email credentials can never be used from the browser. `src/app/api/admin/*` route handlers verify the caller is really an admin (`src/lib/auth/requireAdmin.ts`, using `firebase-admin` — bypasses `firestore.rules` entirely, so this check is the actual security boundary for these routes) before doing anything. Actual sending goes through `src/lib/server/mailer.ts` (`nodemailer` over Gmail SMTP).

**Rate limiting / daily cap**: two separate rails, both in `src/lib/constants.ts`.

- `DAILY_EMAIL_LIMIT` (default 400, override with `NEXT_PUBLIC_DAILY_EMAIL_LIMIT`) — shared across welcome + announcement emails, enforced by `reserveEmailQuota` in `src/lib/server/mailer.ts`. This is a *self-imposed* safety rail, not a known Gmail rule: it exists so a mistake or an unexpectedly large cohort can't burn the mailbox's real quota and get it temporarily locked for sending. Anything over the cap is not dropped — it queues in the `emailCampaigns` doc and goes out on a later run.
- `MAX_EMAILS_PER_RUN` (150) — how many one invocation will send before stopping, so a run finishes inside the route's `maxDuration` (60s, the Vercel Hobby ceiling). Quota is reserved *after* applying this cap, so reserved-but-unsent emails can't leak quota.

Sends are also **paced, not parallel**: the nodemailer transport is pooled and rate-limited (`maxConnections: 2`, ~4 messages/sec) and `processCampaignBatch` awaits one send at a time. Blasting a batch at Gmail concurrently is what actually trips spam heuristics and connection limits — the trickle looks like normal mailbox activity.

A Vercel Cron job (`vercel.json` → `/api/cron/send-email-batches`, daily) drains whatever's still queued. Cron only runs on a deployed Vercel project, not `next dev` — to test batching locally, hit the cron route manually with the `CRON_SECRET` bearer token.

**On Gmail limits**: every recipient is an `@iub.edu.bd` address (signup enforces it, `firestore.rules` re-checks it) and the sender is `cricket.club@iub.edu.bd` — so this is *internal* mail within one Google Workspace domain, which is treated far more permissively than mail to outside addresses. Google Workspace's published ceiling is 2,000 recipients/day; IUB's Workspace admin may have set something lower. The 400 default is deliberately below even the 500/day consumer-Gmail floor, so it's safe regardless of which tier actually applies.

**Setup** (see `.env.example` for the exact variable names):
- `OFFICE_MAIL` / `MAIL_APP_PASSORD` — Gmail address + App Password for the club's email (requires 2-Step Verification enabled first: myaccount.google.com → Security → App passwords). Already configured for this project.
- `FIREBASE_SERVICE_ACCOUNT_KEY` — **still needed.** Firebase Console → Project Settings → Service Accounts → Generate new private key, pasted as a single-line JSON string. Without this, the API routes fail with a clear error rather than silently doing nothing.
- `CRON_SECRET` — any random string, set in Vercel's project env vars (Vercel auto-attaches it as a Bearer token when it triggers the cron job).
- `NEXT_PUBLIC_SITE_URL` — optional, and not needed on Vercel. The welcome email's "View your profile" button auto-detects the production URL from Vercel's built-in `VERCEL_PROJECT_PRODUCTION_URL`. Only set this manually to override that (local testing, or hosting elsewhere).

## Known limitations

- No automated tests — this is an MVP verified through manual/browser testing.
- The gallery's "who can upload/delete/feature" check is enforced by Firestore rules on the `galleryImages` collection (admin-only), but the actual image *files* on Cloudinary have no per-file access control — anyone with a direct image URL can view it (fine for a public club gallery, not suitable for private/sensitive images).
- Firestore composite indexes must be added manually (`firestore.indexes.json`) any time a new query combines a `where` with an `orderBy` on a different field — Firestore does not error at build/type-check time, only at runtime in the browser console (`failed-precondition`).

## Deployment

Deploy the Next.js app on [Vercel](https://vercel.com) (set the same env vars — all `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_CLOUDINARY_*` — in the Vercel project settings). Firebase itself only needs the rules/indexes deploy step above — no separate hosting step is required since the app talks to Firebase and Cloudinary directly from the client.

## Working in VS Code

No special configuration needed — this is a standard Next.js project. Recommended extensions: **ESLint** and **Tailwind CSS IntelliSense**. Run `npm run dev` in the integrated terminal, and `npx tsc --noEmit` / `npx eslint src` before committing to catch issues early (there is no pre-commit hook set up).
