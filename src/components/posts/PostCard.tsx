import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Post } from "@/lib/types";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="card group flex flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
    >
      <h2 className="font-semibold text-navy">{post.title}</h2>
      <p className="line-clamp-2 whitespace-pre-wrap text-sm text-muted">
        {post.body}
      </p>
      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>By {post.authorName}</span>
        <span className="inline-flex items-center gap-1 font-medium text-navy opacity-0 transition group-hover:opacity-100">
          Read more <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
