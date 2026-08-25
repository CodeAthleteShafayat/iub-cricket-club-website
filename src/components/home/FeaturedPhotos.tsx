"use client";

import { useEffect, useState } from "react";
import { transformImage } from "@/lib/services/cloudinary";
import { subscribeToFeaturedGalleryImages } from "@/lib/services/gallery";
import type { GalleryImage } from "@/lib/types";
import PhotoCarousel from "@/components/home/PhotoCarousel";

export default function FeaturedPhotos({
  variant = "card",
}: {
  variant?: "card" | "cover";
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => subscribeToFeaturedGalleryImages(setImages), []);

  if (images.length === 0) return null;

  const carousel = (
    <PhotoCarousel
      variant={variant}
      images={images.map((img) => ({
        src: transformImage(img.url, { width: 1600, height: 900 }),
        alt: img.title ?? "",
      }))}
    />
  );

  if (variant === "cover") return carousel;

  return (
    <section className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
      {carousel}
    </section>
  );
}
