# IUB Cricket Club Website

Official website for the IUB Cricket Club (Independent University, Bangladesh) — club info, a member signup flow with admin approval, member profiles, a news/posts feed, a community message wall, a photo gallery, and a dynamic homepage slideshow.

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

## Not yet built (planned, deferred)

**Admin email feature** — was scoped and approved but not implemented yet. The plan:
- CSV export is done (see Admin guide above); this section is about the *email* half.
- Two features: (1) admin composes an email and sends it to selected/all members, and (2) an automatic email fires when a member is approved or rejected.
- Requires a small server-side piece (a Next.js API route using `nodemailer` + the club's Gmail account via an **App Password**, and `firebase-admin` to verify the caller is really an admin server-side before allowing a send — this is the one place in the app where server-side code is justified, since email credentials can never be safely used from the browser).
- Blocked on two manual setup items from the club's Google Workspace email (`iubcricketclub@iub.edu.bd`, confirmed to be Gmail-based): a Gmail **App Password** (requires 2-Step Verification enabled first), and a Firebase **service account key** (Firebase Console → Project Settings → Service Accounts → Generate new private key).
- Once those two secrets exist, the remaining work is: `npm install nodemailer firebase-admin`, add `src/lib/firebaseAdmin.ts`, `src/lib/email.ts`, `src/app/api/admin/send-email/route.ts`, a `ComposeEmailPanel` component on `/admin/members`, and wiring the auto-email into `approveMember`/`rejectMember` in `src/lib/services/members.ts`.

## Known limitations

- No automated tests — this is an MVP verified through manual/browser testing.
- The gallery's "who can upload/delete/feature" check is enforced by Firestore rules on the `galleryImages` collection (admin-only), but the actual image *files* on Cloudinary have no per-file access control — anyone with a direct image URL can view it (fine for a public club gallery, not suitable for private/sensitive images).
- Firestore composite indexes must be added manually (`firestore.indexes.json`) any time a new query combines a `where` with an `orderBy` on a different field — Firestore does not error at build/type-check time, only at runtime in the browser console (`failed-precondition`).

## Deployment

Deploy the Next.js app on [Vercel](https://vercel.com) (set the same env vars — all `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_CLOUDINARY_*` — in the Vercel project settings). Firebase itself only needs the rules/indexes deploy step above — no separate hosting step is required since the app talks to Firebase and Cloudinary directly from the client.

## Working in VS Code

No special configuration needed — this is a standard Next.js project. Recommended extensions: **ESLint** and **Tailwind CSS IntelliSense**. Run `npm run dev` in the integrated terminal, and `npx tsc --noEmit` / `npx eslint src` before committing to catch issues early (there is no pre-commit hook set up).
