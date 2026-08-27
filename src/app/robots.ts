import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Deliberately short. Account pages (/login, /profile, /community,
      // ...) are kept out of search by a noindex tag on the page itself, NOT
      // by being listed here -- a disallowed URL can't be crawled, so Google
      // never sees its noindex and may still list the bare URL from inbound
      // links. Only routes with nothing to render for a crawler under any
      // circumstances belong in this list.
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
