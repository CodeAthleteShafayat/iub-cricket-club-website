"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deletePost, subscribeToPosts } from "@/lib/services/posts";
import type { Post } from "@/lib/types";

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => subscribeToPosts(setPosts), []);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Posts</h1>
        <Link href="/admin/posts/new" className="btn-primary w-full sm:w-fit">
          <Plus size={16} /> New post
        </Link>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {posts.length === 0 && (
          <p className="text-sm text-muted">No posts yet.</p>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="card flex items-center justify-between gap-3 p-4 text-sm"
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-navy">
                {post.title}
              </div>
              <div className="text-muted">By {post.authorName}</div>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                href={`/admin/posts/${post.id}/edit`}
                className="flex items-center gap-1 font-medium text-navy hover:underline"
              >
                <Pencil size={14} /> Edit
              </Link>
              <button
                onClick={() => deletePost(post.id)}
                className="flex items-center gap-1 font-medium text-red-600 hover:underline"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
