import type { Metadata } from "next";
import { getPostServer } from "@/lib/services/publicContent";
import { transformImage } from "@/lib/services/cloudinary";
import { SITE_URL } from "@/lib/siteUrl";
import { CLUB_NAME } from "@/lib/constants";
import { toJsDate } from "@/lib/utils/bst";
import PostDetail from "@/components/posts/PostDetail";

// Revalidate hourly. Posts change rarely, so this serves a cached page to
// crawlers and visitors alike instead of hitting Firestore per request, while
// still picking up edits without a redeploy.
export const revalidate = 3600;

/** First ~160 chars of the body, on a word boundary, for the meta description. */
function excerpt(body: string, max = 160): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostServer(postId);

  if (!post) {
    return { title: "Post Not Found", robots: { index: false, follow: false } };
  }

  const description = excerpt(post.body);
  // Social crawlers never run JS, so an og:image has to be an absolute URL
  // resolvable on its own. Sized for the 1200x630 preview slot.
  const image = post.imageURL
    ? transformImage(post.imageURL, { width: 1200, crop: "limit" })
    : undefined;

  return {
    title: post.title,
    description,
    alternates: { canonical: `/posts/${postId}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `${SITE_URL}/posts/${postId}`,
      // toJsDate, not new Date(): these are Firestore Timestamps despite the
      // `number` type, and .toISOString() throws on an Invalid Date.
      publishedTime: toJsDate(post.createdAt)?.toISOString(),
      authors: [post.authorName],
      ...(image ? { images: [{ url: image, alt: post.title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  // Fetched here as well as in the client component so the article text is in
  // the initial HTML. PostDetail takes it as initialPost and skips its own
  // fetch, so this is one read, not two.
  const post = await getPostServer(postId);

  const articleJsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: post.title,
        description: excerpt(post.body),
        datePublished: toJsDate(post.createdAt)?.toISOString(),
        dateModified: toJsDate(post.updatedAt)?.toISOString(),
        author: { "@type": "Person", name: post.authorName },
        publisher: {
          "@type": "SportsOrganization",
          name: CLUB_NAME,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        },
        mainEntityOfPage: `${SITE_URL}/posts/${postId}`,
        ...(post.imageURL
          ? { image: transformImage(post.imageURL, { width: 1200, crop: "limit" }) }
          : {}),
      }
    : null;

  return (
    <>
      {articleJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
      )}
      <PostDetail postId={postId} initialPost={post} />
    </>
  );
}
