"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { createPost, updatePost } from "@/lib/services/posts";
import { uploadImage } from "@/lib/services/cloudinary";
import type { Post } from "@/lib/types";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  body: z.string().min(2, "Body is required"),
});

type FormValues = z.infer<typeof schema>;

export default function PostForm({ existingPost }: { existingPost?: Post }) {
  const router = useRouter();
  const { user, member } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existingPost
      ? { title: existingPost.title, body: existingPost.body }
      : undefined,
  });

  async function onSubmit(values: FormValues) {
    if (!user || !member) return;
    setSaving(true);
    setError(null);
    try {
      let imageURL = existingPost?.imageURL ?? null;
      if (imageFile) {
        imageURL = await uploadImage(imageFile, "posts");
      }
      if (existingPost) {
        await updatePost(existingPost.id, { ...values, imageURL });
      } else {
        await createPost({
          ...values,
          imageURL,
          authorUid: user.uid,
          authorName: member.name,
        });
      }
      router.push("/admin/posts");
    } catch {
      setError("Could not save the post. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Title</span>
        <input className="input" {...register("title")} />
        {errors.title && (
          <span className="text-xs text-red-600">{errors.title.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Body</span>
        <textarea className="input" rows={8} {...register("body")} />
        {errors.body && (
          <span className="text-xs text-red-600">{errors.body.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Image (optional)</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary mt-2 w-full sm:w-fit"
      >
        {saving ? "Saving..." : existingPost ? "Update post" : "Publish post"}
      </button>
    </form>
  );
}
