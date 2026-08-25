import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CommunityMessage } from "@/lib/types";

export interface MessageInput {
  authorUid: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
}

export async function sendMessage(input: MessageInput) {
  await addDoc(collection(db, "communityMessages"), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function deleteMessage(id: string) {
  await deleteDoc(doc(db, "communityMessages", id));
}

// Ordered descending so the limit keeps the NEWEST messages (ascending would
// pin the window to the oldest 200 and new messages would stop showing up once
// the collection outgrew it), then reversed so the UI still renders oldest-first.
export function subscribeToMessages(
  callback: (messages: CommunityMessage[]) => void
) {
  const q = query(
    collection(db, "communityMessages"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as CommunityMessage
    );
    callback(messages.reverse());
  });
}
