import Link from "next/link";
import { transformImage } from "@/lib/services/cloudinary";
import { toJsDate } from "@/lib/utils/bst";
import type { Post } from "@/lib/types";

function formatPostDate(value: unknown): string {
  const date = toJsDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
  }).format(date);
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <article className="card flex flex-col gap-3 p-5 sm:p-6">
      <div className="flex items-center justify-between text-xs text-muted">
        <span className="font-medium text-navy">{post.authorName}</span>
        <Link href={`/posts/${post.id}`} className="transition hover:text-navy hover:underline">
          {formatPostDate(post.createdAt)}
        </Link>
      </div>
      <h2 className="font-heading text-lg font-semibold text-navy">{post.title}</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
        {post.body}
      </p>
      {post.imageURL && (
        // eslint-disable-next-line @next/next/no-img-element -- variable aspect ratio, optimization not worth the constraint
        <img
          src={transformImage(post.imageURL, { width: 900, crop: "limit" })}
          alt={post.title}
          className="w-full rounded-lg"
        />
      )}
    </article>
  );
}
