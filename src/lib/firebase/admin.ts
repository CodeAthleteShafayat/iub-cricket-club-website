import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server-only. Never import this from a client component — the service
// account key grants full read/write access to the whole project, bypassing
// firestore.rules entirely.
//
// Lazy on purpose: Next.js evaluates route modules while collecting build
// output, and a top-level throw here (e.g. the env var missing in CI/local
// builds before it's configured) would fail `next build` for every route,
// not just the ones that actually send email. Deferring init to first call
// means only a real request to one of these routes needs the secret.
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is not set. Generate one at Firebase Console -> Project Settings -> Service Accounts -> Generate new private key, then paste the JSON as a single line into .env.local."
    );
  }

  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}

let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function getAdminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getAdminApp());
  return cachedAuth;
}

export function getAdminDb(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}
