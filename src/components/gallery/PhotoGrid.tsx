"use client";

import { FolderInput, Image as ImageIcon, Pencil, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { transformImage } from "@/lib/services/cloudinary";
import {
  deleteGalleryImage,
  moveImageToAlbum,
  setGalleryImageFeatured,
  setGalleryImageTitle,
} from "@/lib/services/gallery";
import type { Album, GalleryImage } from "@/lib/types";

const TITLE_MAX = 120;

/** The photo tiles, lifted out of the old flat gallery page essentially
 *  unchanged, plus a "move to album" control. */
export default function PhotoGrid({
  images,
  albums,
  currentAlbumId,
}: {
  images: GalleryImage[];
  albums: Album[];
  currentAlbumId: string | null;
}) {
  const { member } = useAuth();
  const isAdmin = !!member?.isAdmin;

  async function handleRenameTitle(img: GalleryImage) {
    const next = prompt("Caption for this photo", img.title ?? "");
    if (next === null) return;
    try {
      await setGalleryImageTitle(img.id, next.slice(0, TITLE_MAX));
    } catch {
      alert("Could not update the caption. Please try again.");
    }
  }

  async function handleMove(img: GalleryImage) {
    // Destinations exclude wherever the photo already is, so the list never
    // offers a no-op. A prompt-based picker is crude, but it matches how
    // captions are already edited here and avoids building a modal for an
    // occasional admin action.
    const targets: { id: string | null; label: string }[] = [
      ...(currentAlbumId === null ? [] : [{ id: null, label: "No album (show in main gallery)" }]),
      ...albums
        .filter((a) => a.id !== currentAlbumId)
        .map((a) => ({ id: a.id as string | null, label: a.name })),
    ];

    if (targets.length === 0) {
      alert("There is nowhere else to move this photo yet. Create another album first.");
      return;
    }

    const menu = targets.map((t, i) => `${i + 1} = ${t.label}`).join("\n");
    const answer = prompt(`Move this photo to:\n\n${menu}`, "");
    if (answer === null) return;

    const choice = Number(answer.trim());
    if (!Number.isInteger(choice) || choice < 1 || choice > targets.length) {
      alert("Please enter one of the listed numbers.");
      return;
    }

    try {
      await moveImageToAlbum(img, targets[choice - 1].id);
    } catch {
      alert("Could not move the photo. Please try again.");
    }
  }

  if (images.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/5 text-navy">
          <ImageIcon size={22} />
        </span>
        <p className="text-sm text-muted">
          {isAdmin ? "No photos here yet. Add some above." : "No photos yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {images.map((img) => (
        <figure key={img.id} className="flex flex-col gap-2">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL, plain img keeps this grid simple */}
            <img
              src={transformImage(img.url, { width: 400, height: 400 })}
              alt={img.title || "Club gallery"}
              className="aspect-square w-full rounded-lg object-cover"
            />
            {img.featuredOnHome && (
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy-dark">
                <Star size={12} fill="currentColor" />
              </span>
            )}
            {isAdmin && (
              <div className="absolute right-2 top-2 flex flex-wrap justify-end gap-1.5">
                <button
                  onClick={() => setGalleryImageFeatured(img.id, !img.featuredOnHome)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                    img.featuredOnHome ? "bg-gold text-navy-dark" : "bg-navy-dark/80"
                  }`}
                  aria-label={
                    img.featuredOnHome ? "Remove from homepage" : "Feature on homepage"
                  }
                >
                  <Star size={14} fill={img.featuredOnHome ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => handleRenameTitle(img)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-dark/80 text-white"
                  aria-label="Edit caption"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleMove(img)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-dark/80 text-white"
                  aria-label="Move to another album"
                >
                  <FolderInput size={14} />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this photo? This cannot be undone.")) {
                      deleteGalleryImage(img).catch(() =>
                        alert("Could not delete the photo. Please try again.")
                      );
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-dark/80 text-white"
                  aria-label="Delete photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
          {img.title ? (
            <figcaption className="text-sm leading-snug text-foreground/80">
              {img.title}
            </figcaption>
          ) : (
            isAdmin && (
              <figcaption className="text-xs italic text-muted">
                Untitled &middot; use the pencil to add a caption
              </figcaption>
            )
          )}
        </figure>
      ))}
    </div>
  );
}
