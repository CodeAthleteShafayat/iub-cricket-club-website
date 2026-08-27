import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { deleteAlbum } from "@/lib/services/albums";
import type { GalleryImage } from "@/lib/types";

/** Keeps an album's denormalised photoCount in step, and seeds its cover from
 *  the first photo added. increment() rather than read-modify-write so two
 *  simultaneous uploads can't lose a count. Never throws: a drifted counter is
 *  cosmetic and must not fail the upload the user actually cares about. */
async function bumpAlbumOnAdd(albumId: string, url: string) {
  try {
    const ref = doc(db, "albums", albumId);
    const snap = await getDoc(ref);
    const hasCover = !!snap.data()?.coverImageURL;
    await updateDoc(ref, {
      photoCount: increment(1),
      ...(hasCover ? {} : { coverImageURL: url }),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // ignored on purpose -- see above
  }
}

async function bumpAlbumOnRemove(albumId: string) {
  try {
    await updateDoc(doc(db, "albums", albumId), {
      photoCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
  } catch {
    // ignored on purpose -- see above
  }
}

export async function addGalleryImage(
  url: string,
  uploadedBy: string,
  title: string,
  albumId: string | null
) {
  await addDoc(collection(db, "galleryImages"), {
    url,
    title: title.trim(),
    // Always an explicit null, never absent: Firestore equality filters skip
    // missing fields, so an absent albumId would hide the photo from the
    // Uncategorised query entirely.
    albumId,
    uploadedBy,
    featuredOnHome: false,
    createdAt: serverTimestamp(),
  });
  if (albumId) await bumpAlbumOnAdd(albumId, url);
}

export async function setGalleryImageTitle(id: string, title: string) {
  await updateDoc(doc(db, "galleryImages", id), { title: title.trim() });
}

/** Every photo, newest first. Used only by the admin "move photo" picker and
 *  the backfill check -- the public gallery reads albums instead, which is the
 *  whole point of the feature. */
export function subscribeToGalleryImages(
  callback: (images: GalleryImage[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, "galleryImages"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryImage)),
    (error) => onError?.(error)
  );
}

/** Photos in one album, or the Uncategorised bucket when albumId is null.
 *  Needs the galleryImages (albumId ASC, createdAt DESC) composite index. */
export function subscribeToAlbumImages(
  albumId: string | null,
  callback: (images: GalleryImage[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, "galleryImages"),
    where("albumId", "==", albumId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryImage)),
    (error) => onError?.(error)
  );
}

export function subscribeToFeaturedGalleryImages(
  callback: (images: GalleryImage[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, "galleryImages"),
    where("featuredOnHome", "==", true),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryImage)),
    (error) => onError?.(error)
  );
}

export async function setGalleryImageFeatured(id: string, featured: boolean) {
  await updateDoc(doc(db, "galleryImages", id), { featuredOnHome: featured });
}

/** Moves one photo between albums, keeping both counters correct. */
export async function moveImageToAlbum(
  image: GalleryImage,
  targetAlbumId: string | null
) {
  const from = image.albumId ?? null;
  if (from === targetAlbumId) return;

  await updateDoc(doc(db, "galleryImages", image.id), { albumId: targetAlbumId });
  if (from) await bumpAlbumOnRemove(from);
  if (targetAlbumId) await bumpAlbumOnAdd(targetAlbumId, image.url);
}

export async function deleteGalleryImage(image: GalleryImage) {
  await deleteDoc(doc(db, "galleryImages", image.id));
  if (image.albumId) await bumpAlbumOnRemove(image.albumId);
}

/**
 * Deletes an album but keeps its photos, moving them to Uncategorised.
 *
 * Deliberately non-destructive, matching how deleting a tournament keeps its
 * matches. Photos are also the one thing here that can't be recovered: the
 * Cloudinary asset outlives the Firestore document, but the URL would be lost
 * with it.
 */
export async function deleteAlbumKeepingPhotos(albumId: string) {
  const snap = await getDocs(
    query(collection(db, "galleryImages"), where("albumId", "==", albumId))
  );

  // Firestore caps a batch at 500 writes; chunk so a large album can't fail.
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = writeBatch(db);
    for (const d of docs.slice(i, i + 400)) {
      batch.update(d.ref, { albumId: null });
    }
    await batch.commit();
  }

  await deleteAlbum(albumId);
}
