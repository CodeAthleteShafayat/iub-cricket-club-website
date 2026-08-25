import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { EmailCampaign } from "@/lib/types";

// Read-only: campaign docs are only ever written by the admin API routes via
// the Firebase Admin SDK (see src/lib/server/campaigns.ts), which bypasses
// firestore.rules entirely. The client only ever subscribes to watch status.
export function subscribeToEmailCampaigns(
  callback: (campaigns: EmailCampaign[]) => void
) {
  const q = query(collection(db, "emailCampaigns"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EmailCampaign));
  });
}
