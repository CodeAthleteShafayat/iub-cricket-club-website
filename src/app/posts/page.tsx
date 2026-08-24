"use client";

import { useEffect, useState } from "react";
import { subscribeToPosts } from "@/lib/services/posts";
import type { Post } from "@/lib/types";
import PostCard from "@/components/posts/PostCard";
import PageHeader from "@/components/ui/PageHeader";

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToPosts((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <PageHeader title="News & Announcements" />
      <div className="flex flex-col gap-6">
        {loading && <p className="text-sm text-muted">Loading posts...</p>}
        {!loading && posts.length === 0 && (
          <p className="text-sm text-muted">No posts yet.</p>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
