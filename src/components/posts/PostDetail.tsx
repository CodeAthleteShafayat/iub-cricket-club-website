"use client";

import { useEffect, useState } from "react";
import { getPost } from "@/lib/services/posts";
import { transformImage } from "@/lib/services/cloudinary";
import type { Post } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";

export default function PostDetail({
  postId,
  initialPost,
}: {
  postId: string;
  /** Server-fetched post, so the article text is present in the initial HTML
   *  for crawlers. When supplied, the client fetch below is skipped entirely.
   *  Undefined (not null) means "nothing was passed" -- null means the server
   *  looked and the post genuinely doesn't exist. */
  initialPost?: Post | null;
}) {
  const [post, setPost] = useState<Post | null | undefined>(initialPost);

  useEffect(() => {
    if (initialPost !== undefined) return;
    getPost(postId).then(setPost);
  }, [postId, initialPost]);

  if (post === undefined) return <Spinner />;
  if (post === null) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted sm:px-6">
        Post not found.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <span className="section-eyebrow mb-4">News</span>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-2 text-sm text-muted">By {post.authorName}</p>
      {post.imageURL && (
        // eslint-disable-next-line @next/next/no-img-element -- variable aspect ratio, optimization not worth the constraint
        <img
          src={transformImage(post.imageURL, { width: 1200, crop: "limit" })}
          alt={post.title}
          className="mt-6 w-full rounded-xl"
        />
      )}
      <div className="mt-6 whitespace-pre-wrap leading-relaxed text-foreground/80">
        {post.body}
      </div>
    </div>
  );
}
