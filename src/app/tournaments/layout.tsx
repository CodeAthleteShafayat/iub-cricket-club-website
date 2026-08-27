import type { Metadata } from "next";
import { CLUB_NAME } from "@/lib/constants";

// Attaches metadata for the client-rendered /tournaments page. See the note
// in src/app/posts/layout.tsx for why this layout exists, and why the title
// is an object rather than a plain string.
export const metadata: Metadata = {
  title: {
    default: "Tournaments & Fixtures",
    template: `%s | ${CLUB_NAME}`,
  },
  description:
    "IUB Cricket Club tournaments: fixtures, live results, group stages, and points tables from inter-university and on-campus competitions.",
  alternates: { canonical: "/tournaments" },
  openGraph: {
    title: "Tournaments & Fixtures | IUB Cricket Club",
    description:
      "IUB Cricket Club tournaments: fixtures, live results, group stages, and points tables.",
    url: "/tournaments",
  },
};

export default function TournamentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
