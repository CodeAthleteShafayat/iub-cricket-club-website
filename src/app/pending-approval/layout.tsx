import type { Metadata } from "next";

// Members-only page. The page component is "use client" and so can't export
// metadata itself; this pass-through layout carries the noindex instead.
export const metadata: Metadata = {
  title: "Application Pending",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
