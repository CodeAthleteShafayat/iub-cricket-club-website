<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: IUB Cricket Club Website

Next.js (App Router) + Firebase (Auth + Firestore) club website. No custom backend — the Next.js app talks to Firebase and Cloudinary directly from client components. The one exception is the admin email feature (`src/app/api/admin/*`, `src/lib/server/*`) — see "Admin email feature" below.

## Architecture rules to preserve

- **Client-side Firebase only, with one exception.** No `firebase-admin`, no server sessions, no API routes for data access — except the admin email feature (`src/app/api/admin/*`, `src/lib/server/*`, `src/lib/firebase/admin.ts`), which is server-side by necessity since email credentials can never be used from the browser. Every other Firestore/Auth call goes through `src/lib/firebase/client.ts` and the functions in `src/lib/services/*`. Keep new features on the client-side pattern unless the user explicitly asks to introduce more server-side surface.
- **Deleting a member must remove the Firebase Auth user too**, not just `members/{uid}`. `deleteDoc` alone leaves an orphaned login: the person can still sign in and their email stays permanently unavailable for re-registration. Auth deletion needs the Admin SDK, so it goes through `src/app/api/admin/delete-member/route.ts` (which also guards against deleting yourself or the last admin). Don't "simplify" `deleteMember()` back into a direct `deleteDoc`.
- **Don't touch the `jose` pin or the `--webpack` build flag without reading this.** `package.json` pins `overrides.jose` to `^5.x`, and `npm run build` runs `scripts/check-cjs-compat.mjs` first. Reason: Vercel's Lambda module loader overrides Node's `Module._load` and does **not** implement `require()`-of-ESM interop (even on Node 22.23, where stock Node does). `firebase-admin` → `jwks-rsa` calls `require('jose')`, and jose 6+ is ESM-only, so an unpinned jose makes **every admin API route** crash in production with `ERR_REQUIRE_ESM` — while working perfectly in local dev. The prebuild guard fails the build if the pin is ever removed or bumped; don't delete it to "fix" a build error.
- **`firestore.rules` is the real security boundary**, not the UI. `AuthGuard`, `ApprovedGuard`, `AdminGuard` (`src/components/auth/*`) only redirect for UX — they do not gate data access. Any new read/write path needs a corresponding rule in `firestore.rules`, and the rule change must be deployed (`npx firebase-tools deploy --only firestore:rules --project <project-id>`) before it takes effect. Don't assume a UI guard is sufficient security.
- **Member lifecycle**: `members/{uid}` doc has `status: pending|approved|rejected` and `isAdmin: boolean`. Admins must always have `status: "approved"` too — the guards check `status`, not `isAdmin`, for general member access.
- **New Firestore queries that combine a `where` with an `orderBy` on a different field need a composite index** — add it to `firestore.indexes.json` and deploy with `--only firestore:indexes`, or Firestore will throw `failed-precondition` at runtime (it won't fail at build/type-check time, and takes 1-2 minutes to finish building after deploy — don't mistake a still-building index for a bug).
- **Images use Cloudinary, not Firebase Storage** (Storage requires the paid Blaze plan; Cloudinary's free tier needs no card). Uploads go directly from the browser to Cloudinary via `uploadImage()` in `src/lib/services/cloudinary.ts` (an unsigned upload preset — safe to call from client code, can only create new uploads). The resulting URL is stored as a plain string in Firestore: `members.photoURL`, `posts.imageURL`, and the `galleryImages` collection (since Cloudinary's free tier can't safely list "all uploaded files" from the browser, gallery images are indexed in Firestore instead).
- **Always pass image URLs through `transformImage()` before rendering** (same file as `uploadImage`) — a raw Cloudinary URL serves the full original upload (can be several MB from a phone camera). Never render `img.url`/`photoURL`/`imageURL` directly in an `<img src>`.
- **The homepage slideshow is driven by Firestore, not hardcoded images.** `src/components/home/FeaturedPhotos.tsx` subscribes to `galleryImages` where `featuredOnHome == true`. To change what's on the homepage, star/unstar photos at `/gallery` — don't hardcode image paths into `src/app/page.tsx` again.
- **`next dev` regenerates the Next.js block above** on every run — never remove it in a diff; only add to this file below it.

## Where things live

- Routes: `src/app/**` (App Router — note Next 16 dynamic `params`/`searchParams` are `Promise`s, must `await`)
- Firebase client singletons: `src/lib/firebase/client.ts`
- Auth + live member state: `src/lib/auth/AuthContext.tsx` (`useAuth()`)
- Firestore read/write helpers: `src/lib/services/{members,posts,community,gallery}.ts`
- Image uploads + transforms: `src/lib/services/cloudinary.ts`
- CSV export: `src/lib/utils/csv.ts` (client-side only, reuses whatever member list is already loaded on `/admin/members` — no extra Firestore reads)
- Homepage slideshow: `src/components/home/PhotoCarousel.tsx` (generic, dumb fade carousel) + `FeaturedPhotos.tsx` (Firestore-backed wrapper — this is the one to touch, not the carousel itself)
- Shared types: `src/lib/types.ts`
- Logo: `public/logo.png` (used in Navbar/Footer) and `src/app/icon.png` (favicon) — same asset, background already removed

## Admin email feature

Built — see README.md's "Admin email feature" section for the full architecture, setup, and daily-quota/batching design before touching this. Quick map: `src/lib/auth/requireAdmin.ts` (server-side admin check, the actual security boundary for these routes), `src/lib/server/mailer.ts` (nodemailer + templates + the shared daily quota), `src/lib/server/campaigns.ts` (bulk-send batching), `src/app/api/admin/{send-email,send-welcome-email}/route.ts` + `src/app/api/cron/send-email-batches/route.ts`, `ComposeEmailPanel` on `/admin/members`. Sends are paced and capped by `DAILY_EMAIL_LIMIT` / `MAX_EMAILS_PER_RUN` in `src/lib/constants.ts` — read the README section before changing either. Requires `OFFICE_MAIL`, `MAIL_APP_PASSORD`, `FIREBASE_SERVICE_ACCOUNT_KEY`, and `CRON_SECRET` (see `.env.example`).

## Verifying changes

No test suite. Verify manually: `npm run dev`, then check the relevant page in a browser against the real Firebase project (a placeholder `.env.local` will make `getAuth()`/Firestore calls fail — see README for real setup steps). Watch the browser console for `permission-denied` (rules issue) or `failed-precondition` (missing/still-building index) errors, not just visual rendering. `npm run build` should also be run before considering a change done — it type-checks and prerenders every route, catching issues `next dev` sometimes doesn't.
