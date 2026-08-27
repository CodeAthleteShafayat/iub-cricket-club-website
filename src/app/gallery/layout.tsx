import type { Metadata } from "next";

// Attaches metadata for the client-rendered /gallery page. See the note in
// src/app/posts/layout.tsx for why this layout exists.
export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Photos from IUB Cricket Club practices, matches, tournaments, and club events at Independent University, Bangladesh.",
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Photo Gallery | IUB Cricket Club",
    description:
      "Photos from IUB Cricket Club practices, matches, tournaments, and club events.",
    url: "/gallery",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
