"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Image as ImageIcon, Pencil, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { transformImage, uploadImage } from "@/lib/services/cloudinary";
import {
  addGalleryImage,
  deleteGalleryImage,
  setGalleryImageFeatured,
  setGalleryImageTitle,
  subscribeToGalleryImages,
} from "@/lib/services/gallery";
import type { GalleryImage } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";

const TITLE_MAX = 120;

export default function GalleryPage() {
  const { user, member } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Holds the picked file until a caption is entered, so the title is always
  // attached to the photo the admin is actually looking at.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeToGalleryImages((imgs) => {
      setImages(imgs);
      setLoading(false);
    });
  }, []);

  // Revoke the object URL when the preview changes or unmounts, otherwise each
  // picked file leaks its blob for the lifetime of the page.
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  function handleFilePick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setUploadError(null);
    setPendingFile(file);
    setPendingPreview(file ? URL.createObjectURL(file) : null);
    setPendingTitle("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function cancelPending() {
    setPendingFile(null);
    setPendingPreview(null);
    setPendingTitle("");
    setUploadError(null);
  }

  async function handleUpload() {
    if (!pendingFile || !user) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImage(pendingFile, "gallery");
      await addGalleryImage(url, user.uid, pendingTitle);
      cancelPending();
    } catch {
      setUploadError("Could not upload that photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRenameTitle(img: GalleryImage) {
    const next = prompt("Photo title", img.title ?? "");
    if (next === null) return;
    try {
      await setGalleryImageTitle(img.id, next.slice(0, TITLE_MAX));
    } catch {
      setUploadError("Could not update the title. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Gallery"
          description={
            member?.isAdmin
              ? "Add a title so visitors know what each photo shows. Star a photo to feature it in the homepage slideshow."
              : undefined
          }
        />
        {member?.isAdmin && !pendingFile && (
          <label className="btn-outline w-fit cursor-pointer">
            Add photo
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFilePick}
              className="hidden"
            />
          </label>
        )}
      </div>

      {member?.isAdmin && pendingFile && (
        <div className="card mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
          {pendingPreview && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob: preview
            <img
              src={pendingPreview}
              alt=""
              className="h-32 w-32 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="flex flex-1 flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-navy">Photo title</span>
              <input
                className="input"
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
                maxLength={TITLE_MAX}
                placeholder="e.g. Inter-university final vs NSU, 2026"
                autoFocus
              />
              <span className="text-xs text-muted">
                Shown under the photo. Leave blank to upload without a title.
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="btn-primary !px-4 !py-2 text-sm"
              >
                {uploading ? "Uploading..." : "Upload photo"}
              </button>
              <button
                onClick={cancelPending}
                disabled={uploading}
                className="btn-outline !px-4 !py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadError && <p className="mb-4 text-sm text-red-600">{uploadError}</p>}

      {loading && <p className="text-sm text-muted">Loading photos...</p>}

      {!loading && images.length === 0 && (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/5 text-navy">
            <ImageIcon size={22} />
          </span>
          <p className="text-sm text-muted">No photos yet.</p>
        </div>
      )}

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
              {member?.isAdmin && (
                <div className="absolute right-2 top-2 flex gap-1.5">
                  <button
                    onClick={() =>
                      setGalleryImageFeatured(img.id, !img.featuredOnHome)
                    }
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                      img.featuredOnHome ? "bg-gold text-navy-dark" : "bg-navy-dark/80"
                    }`}
                    aria-label={
                      img.featuredOnHome
                        ? "Remove from homepage"
                        : "Feature on homepage"
                    }
                  >
                    <Star size={14} fill={img.featuredOnHome ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => handleRenameTitle(img)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-dark/80 text-white"
                    aria-label="Edit title"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this photo? This cannot be undone.")) {
                        deleteGalleryImage(img.id);
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
              member?.isAdmin && (
                <figcaption className="text-xs italic text-muted">
                  Untitled
                </figcaption>
              )
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}
