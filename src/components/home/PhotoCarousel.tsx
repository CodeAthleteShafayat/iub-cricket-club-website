"use client";

import { useEffect, useState } from "react";

export interface CarouselImage {
  src: string;
  alt: string;
}

export default function PhotoCarousel({
  images,
  variant = "card",
}: {
  images: CarouselImage[];
  variant?: "card" | "cover";
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [paused, images.length]);

  if (images.length === 0) return null;

  // The featured list is live from Firestore, so it can shrink while this is
  // mounted (an admin un-stars a photo). Wrapping keeps a stale index from
  // pointing past the end, which would fade every slide out and show nothing.
  const activeIndex = index % images.length;
  const isCover = variant === "cover";

  return (
    <div
      className={
        isCover
          ? "absolute inset-0"
          : "relative aspect-video w-full overflow-hidden rounded-lg border border-border shadow-[0_1px_2px_rgba(15,30,61,0.05)]"
      }
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- fixed local asset set, simple crossfade doesn't need next/image
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          // The first slide is the hero's visible content, so it must not be
          // queued behind other requests; the rest are off-screen until the
          // carousel advances and can load lazily.
          loading={i === 0 ? "eager" : "lazy"}
          fetchPriority={i === 0 ? "high" : "low"}
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1400ms] ease-out ${
            i === activeIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
          }`}
        />
      ))}

      {!isCover && (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-dark/40 to-transparent" />

          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === activeIndex ? "w-6 bg-gold" : "w-2 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
