"use client";

import { useEffect, useState } from "react";

export interface CarouselImage {
  src: string;
  alt: string;
}

export default function PhotoCarousel({ images }: { images: CarouselImage[] }) {
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

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- fixed local asset set, simple crossfade doesn't need next/image
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {images.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-gold" : "w-2 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
