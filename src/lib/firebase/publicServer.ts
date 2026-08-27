import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * A Firestore handle for reading PUBLIC data during server rendering.
 *
 * Deliberately the ordinary client SDK, not firebase-admin. The Admin SDK
 * bypasses firestore.rules completely, so a page built on it would keep
 * serving a collection even after the rules were tightened to forbid it.
 * This connects as an unauthenticated caller instead, so every read is still
 * evaluated against firestore.rules exactly as a browser's would be -- it can
 * only ever reach data already marked `allow read: if true`, and it
 * automatically stops working if that changes.
 *
 * It therefore grants no privilege the public does not already have, and
 * needs no service account.
 *
 * Uses its own named Firebase app so it never collides with the browser
 * singleton in ./client.ts (which also initializes Auth -- unwanted here).
 */
const APP_NAME = "public-server-reader";

function getPublicApp() {
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return getApp(APP_NAME);
  return initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    APP_NAME
  );
}

export function getPublicDb() {
  return getFirestore(getPublicApp());
}
