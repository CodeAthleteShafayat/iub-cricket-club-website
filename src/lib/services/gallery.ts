import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { GalleryImage } from "@/lib/types";

export async function addGalleryImage(
  url: string,
  uploadedBy: string,
  title: string
) {
  await addDoc(collection(db, "galleryImages"), {
    url,
    title: title.trim(),
    uploadedBy,
    featuredOnHome: false,
    createdAt: serverTimestamp(),
  });
}

export async function setGalleryImageTitle(id: string, title: string) {
  await updateDoc(doc(db, "galleryImages", id), { title: title.trim() });
}

export function subscribeToGalleryImages(
  callback: (images: GalleryImage[]) => void
) {
  const q = query(collection(db, "galleryImages"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryImage));
  });
}

export function subscribeToFeaturedGalleryImages(
  callback: (images: GalleryImage[]) => void
) {
  const q = query(
    collection(db, "galleryImages"),
    where("featuredOnHome", "==", true),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GalleryImage));
  });
}

export async function setGalleryImageFeatured(id: string, featured: boolean) {
  await updateDoc(doc(db, "galleryImages", id), { featuredOnHome: featured });
}

export async function deleteGalleryImage(id: string) {
  await deleteDoc(doc(db, "galleryImages", id));
}
