"use client";

import { useEffect, useState } from "react";
import { subscribeToAboutContent } from "@/lib/services/about";
import { transformImage } from "@/lib/services/cloudinary";
import type { AboutContent } from "@/lib/types";

export default function AboutEditableSection() {
  const [content, setContent] = useState<AboutContent | null>(null);

  useEffect(() => subscribeToAboutContent(setContent), []);

  if (!content || !content.body.trim()) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold text-navy">
        From the Club
      </h2>
      {content.imageURL && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL, domain not in next/image config
        <img
          src={transformImage(content.imageURL, { width: 900 })}
          alt=""
          className="w-full rounded-lg object-cover"
        />
      )}
      <p className="whitespace-pre-line">{content.body}</p>
    </section>
  );
}
