import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { AboutContent } from "@/lib/types";

const ABOUT_DOC = doc(db, "content", "about");

export function subscribeToAboutContent(callback: (content: AboutContent | null) => void) {
  return onSnapshot(ABOUT_DOC, (snap) => {
    callback(snap.exists() ? (snap.data() as AboutContent) : null);
  });
}

export async function setAboutContent(input: {
  body: string;
  imageURL: string | null;
  adminUid: string;
}) {
  await setDoc(ABOUT_DOC, {
    body: input.body,
    imageURL: input.imageURL,
    updatedBy: input.adminUid,
    updatedAt: serverTimestamp(),
  });
}
