import type { Metadata } from "next";
import { CLUB_NAME } from "@/lib/constants";

// The /posts page itself is a client component (live Firestore feed), and a
// "use client" module can't export metadata -- so it lives here instead. This
// layout renders nothing of its own; it exists purely to attach metadata.
export const metadata: Metadata = {
  // Object form, not a plain string: a string here would resolve this
  // segment's own title but leave child segments (/posts/[postId]) with no
  // template to inherit, so article titles would lose the " | IUB Cricket
  // Club" suffix. Re-declaring the template keeps it flowing downward.
  title: {
    default: "News & Announcements",
    template: `%s | ${CLUB_NAME}`,
  },
  description:
    "Latest news from the IUB Cricket Club: match results, practice schedules, tournament announcements, and club updates.",
  alternates: { canonical: "/posts" },
  openGraph: {
    title: "News & Announcements | IUB Cricket Club",
    description:
      "Latest news from the IUB Cricket Club: match results, practice schedules, tournament announcements, and club updates.",
    url: "/posts",
  },
};

export default function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
