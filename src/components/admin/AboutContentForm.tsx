"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/AuthContext";
import { setAboutContent, subscribeToAboutContent } from "@/lib/services/about";
import { transformImage, uploadImage } from "@/lib/services/cloudinary";
import type { AboutContent } from "@/lib/types";

const schema = z.object({
  body: z.string().min(2, "Write something first"),
});

type FormValues = z.infer<typeof schema>;

export default function AboutContentForm() {
  const { user } = useAuth();
  const [existing, setExisting] = useState<AboutContent | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => subscribeToAboutContent(setExisting), []);

  useEffect(() => {
    if (existing) reset({ body: existing.body });
  }, [existing, reset]);

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      let imageURL = existing?.imageURL ?? null;
      if (imageFile) {
        imageURL = await uploadImage(imageFile, "about");
      }
      await setAboutContent({ body: values.body, imageURL, adminUid: user.uid });
      setImageFile(null);
      setSaved(true);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const displayedImage = imagePreview ?? existing?.imageURL ?? null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-navy">Text</span>
        <textarea className="input" rows={8} {...register("body")} />
        {errors.body && (
          <span className="text-xs text-red-600">{errors.body.message}</span>
        )}
      </label>

      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-navy">Image (optional)</span>
        {displayedImage && (
          // eslint-disable-next-line @next/next/no-img-element -- preview can be a local blob: URL
          <img
            src={transformImage(displayedImage, { width: 600 })}
            alt=""
            className="max-h-48 w-fit rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setImageFile(file);
            setImagePreview(file ? URL.createObjectURL(file) : null);
          }}
          className="text-xs"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved. The About page is now updated.</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn-primary mt-2 w-full sm:w-fit"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
