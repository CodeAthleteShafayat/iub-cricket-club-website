import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Post } from "@/lib/types";

export interface PostInput {
  title: string;
  body: string;
  imageURL: string | null;
  authorUid: string;
  authorName: string;
}

export async function createPost(input: PostInput) {
  await addDoc(collection(db, "posts"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToPosts(callback: (posts: Post[]) => void) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
  });
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, "posts", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Post) : null;
}

export async function updatePost(
  id: string,
  edits: Partial<Pick<Post, "title" | "body" | "imageURL">>
) {
  await updateDoc(doc(db, "posts", id), {
    ...edits,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(id: string) {
  await deleteDoc(doc(db, "posts", id));
}
