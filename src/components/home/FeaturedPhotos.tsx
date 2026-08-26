"use client";

import { useEffect, useState } from "react";
import { transformImage } from "@/lib/services/cloudinary";
import { subscribeToFeaturedGalleryImages } from "@/lib/services/gallery";
import type { GalleryImage } from "@/lib/types";
import PhotoCarousel from "@/components/home/PhotoCarousel";

interface Slide {
  src: string;
  alt: string;
}

// The hero photos can't render until Firestore answers with their URLs, which
// left the bare navy hero visible for the first second of every page load.
// Caching the resolved slides means a returning visitor starts downloading the
// actual images immediately on mount instead of waiting out that round-trip.
//
// Worst case the cache is one visit stale (an admin star/unstar shows up on the
// next load), which is a fair trade for removing the flash. The live
// subscription still overwrites it as soon as it responds.
const CACHE_KEY = "iubcc:featured-photos";

function readCachedSlides(): Slide[] {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is Slide =>
        !!s && typeof s.src === "string" && typeof s.alt === "string"
    );
  } catch {
    // Private browsing, disabled storage, or corrupt JSON -- fall back to the
    // normal Firestore-only path rather than breaking the homepage.
    return [];
  }
}

function writeCachedSlides(slides: Slide[]) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(slides));
  } catch {
    // Storage full or unavailable; the carousel works fine without the cache.
  }
}

export default function FeaturedPhotos({
  variant = "card",
}: {
  variant?: "card" | "cover";
}) {
  const [slides, setSlides] = useState<Slide[]>([]);

  useEffect(() => {
    // Painted on the very next frame, well before Firestore replies.
    //
    // This has to happen after mount rather than in a useState initializer:
    // the homepage is prerendered at build time, where localStorage doesn't
    // exist, so seeding state during render would make the client's first
    // render disagree with the server HTML and trip a hydration mismatch.
    const cached = readCachedSlides();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: see above
    if (cached.length > 0) setSlides(cached);

    return subscribeToFeaturedGalleryImages((images: GalleryImage[]) => {
      const next = images.map((img) => ({
        src: transformImage(img.url, { width: 1600, height: 900 }),
        alt: img.title ?? "",
      }));
      setSlides(next);
      writeCachedSlides(next);
    });
  }, []);

  if (slides.length === 0) return null;

  const carousel = <PhotoCarousel variant={variant} images={slides} />;

  if (variant === "cover") return carousel;

  return (
    <section className="mx-auto max-w-5xl px-4 pt-16 sm:px-6">
      {carousel}
    </section>
  );
}
