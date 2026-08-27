// One-off migration: give every pre-existing gallery photo an explicit
// albumId: null.
//
// Why this is required rather than optional: Firestore equality filters do not
// match documents where the field is absent. Photos uploaded before albums
// existed have no albumId at all, so `where("albumId", "==", null)` would skip
// them and they would vanish from the Uncategorised view -- present in the
// database, invisible in the UI.
//
// Safe to re-run: documents that already have the field are left alone.
//
// Usage: node --env-file=.env.local scripts/backfill-album-ids.mjs [--apply]
// Without --apply it only reports what it would change.

import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const apply = process.argv.includes("--apply");

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set. See .env.example.");
  process.exit(1);
}

const db = getFirestore(initializeApp({ credential: cert(JSON.parse(raw)) }));

const snap = await db.collection("galleryImages").get();
const missing = snap.docs.filter((d) => d.data().albumId === undefined);

console.log(`galleryImages total:            ${snap.size}`);
console.log(`missing an albumId field:       ${missing.length}`);

if (missing.length === 0) {
  console.log("\nNothing to do.");
  process.exit(0);
}

if (!apply) {
  console.log("\nDry run. Re-run with --apply to write albumId: null to these.");
  process.exit(0);
}

// Chunked well under Firestore's 500-writes-per-batch cap.
for (let i = 0; i < missing.length; i += 400) {
  const batch = db.batch();
  for (const d of missing.slice(i, i + 400)) {
    batch.update(d.ref, { albumId: null });
  }
  await batch.commit();
}

const after = await db.collection("galleryImages").get();
const stillMissing = after.docs.filter((d) => d.data().albumId === undefined).length;
console.log(`\nBackfilled ${missing.length}. Still missing: ${stillMissing}`);
process.exit(stillMissing === 0 ? 0 : 1);
