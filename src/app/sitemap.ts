import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import {
  getAllPostsForSitemap,
  getAllTournamentsForSitemap,
} from "@/lib/services/publicContent";

// Only public, crawlable routes belong here -- listing a page in the sitemap
// while robots.ts disallows it sends Google contradictory signals, so the
// members-only and admin routes are deliberately absent.

// Rebuilt hourly so posts published after a deploy still reach the sitemap
// without one.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const [posts, tournaments] = await Promise.all([
    getAllPostsForSitemap(),
    getAllTournamentsForSitemap(),
  ]);

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/posts`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tournaments`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/gallery`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    // The recruitment landing page -- the other auth screens are noindex.
    {
      url: `${SITE_URL}/signup`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    ...posts.map((p) => ({
      url: `${SITE_URL}/posts/${p.id}`,
      lastModified: p.lastModified ?? lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...tournaments.map((t) => ({
      url: `${SITE_URL}/tournaments/${t.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
