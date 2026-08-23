"use client";

import { useEffect, useState } from "react";
import { getPost } from "@/lib/services/posts";
import type { Post } from "@/lib/types";
import PostForm from "@/components/posts/PostForm";
import Spinner from "@/components/ui/Spinner";

export default function EditPostForm({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null | undefined>(undefined);

  useEffect(() => {
    getPost(postId).then(setPost);
  }, [postId]);

  if (post === undefined) return <Spinner />;
  if (post === null) {
    return <p className="text-sm text-foreground/60">Post not found.</p>;
  }

  return <PostForm existingPost={post} />;
}
