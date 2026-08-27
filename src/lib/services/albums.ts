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
import type { Album } from "@/lib/types";

/** Route segment standing in for "photos with no album". Firestore auto-ids
 *  are 20 characters, so this can never collide with a real album id.
 *  Declared once here rather than repeated as a string literal. */
export const UNCATEGORISED = "uncategorised";

export interface AlbumInput {
  name: string;
  description: string;
  tournamentId: string | null;
  createdBy: string;
}

export async function createAlbum(input: AlbumInput) {
  await addDoc(collection(db, "albums"), {
    ...input,
    // Set by the first upload into this album; see addGalleryImage.
    coverImageURL: null,
    photoCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToAlbums(
  callback: (albums: Album[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, "albums"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Album)),
    // Without this, a permission error or a still-building index leaves the
    // page spinning with nothing in the console to explain it.
    (error) => onError?.(error)
  );
}

export async function getAlbum(id: string): Promise<Album | null> {
  const snap = await getDoc(doc(db, "albums", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Album) : null;
}

export async function updateAlbum(
  id: string,
  edits: Partial<Pick<Album, "name" | "description" | "tournamentId" | "coverImageURL">>
) {
  await updateDoc(doc(db, "albums", id), {
    ...edits,
    updatedAt: serverTimestamp(),
  });
}

/** Deletes only the album document. Callers must first move its photos to
 *  Uncategorised (see deleteAlbumAndOrphanPhotos in gallery.ts) -- deleting
 *  the album alone would leave photos pointing at a missing id. */
export async function deleteAlbum(id: string) {
  await deleteDoc(doc(db, "albums", id));
}
