/**
 * The club's public origin, with no trailing slash. Used for canonical URLs,
 * the sitemap, Open Graph tags, and links inside outgoing email.
 *
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically on every deployment
 * (and it keeps pointing at the production domain even from a preview build,
 * which is what canonical/OG tags want), so nothing needs configuring there.
 * NEXT_PUBLIC_SITE_URL overrides it for local testing or non-Vercel hosting.
 */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/** Absolute URL for a site-relative path, e.g. absoluteUrl("/posts"). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
