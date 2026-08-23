import {
  addDoc,
  collection,
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

export function subscribeToMessages(
  callback: (messages: CommunityMessage[]) => void
) {
  const q = query(
    collection(db, "communityMessages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CommunityMessage)
    );
  });
}
