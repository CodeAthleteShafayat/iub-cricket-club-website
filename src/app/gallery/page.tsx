"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Image as ImageIcon, Star, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { transformImage, uploadImage } from "@/lib/services/cloudinary";
import {
  addGalleryImage,
  deleteGalleryImage,
  setGalleryImageFeatured,
  subscribeToGalleryImages,
} from "@/lib/services/gallery";
import type { GalleryImage } from "@/lib/types";
import PageHeader from "@/components/ui/PageHeader";

export default function GalleryPage() {
  const { user, member } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeToGalleryImages((imgs) => {
      setImages(imgs);
      setLoading(false);
    });
  }, []);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "gallery");
      await addGalleryImage(url, user.uid);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Gallery"
          description={
            member?.isAdmin
              ? "Click the star on a photo to feature it in the homepage slideshow."
              : undefined
          }
        />
        {member?.isAdmin && (
          <label className="btn-outline w-fit cursor-pointer">
            {uploading ? "Uploading..." : "Add photo"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

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
          <div key={img.id} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL, plain img keeps this grid simple */}
            <img
              src={transformImage(img.url, { width: 400, height: 400 })}
              alt="Club gallery"
              className="aspect-square w-full rounded-lg object-cover"
            />
            {img.featuredOnHome && (
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-navy-dark">
                <Star size={12} fill="currentColor" />
              </span>
            )}
            {member?.isAdmin && (
              <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition group-hover:opacity-100">
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
                  onClick={() => deleteGalleryImage(img.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-dark/80 text-white"
                  aria-label="Delete photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
