"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { uploadImage } from "@/lib/services/cloudinary";
import { addGalleryImage } from "@/lib/services/gallery";

/**
 * Multi-select photo upload for one album.
 *
 * Uploads run strictly sequentially. Each file goes through compressImage(),
 * which decodes a full-resolution bitmap onto a canvas -- doing forty of those
 * concurrently exhausts memory on a phone, which is exactly the device someone
 * uploads match photos from.
 *
 * Captions are not collected here. Typing forty captions before anything
 * uploads is worse than typing none; they stay editable per-photo afterwards.
 */
export default function PhotoUploader({ albumId }: { albumId: string | null }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Reset immediately so picking the same files again still fires onChange.
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0 || !user) return;

    setBusy(true);
    setTotal(files.length);
    setDone(0);
    setFailed([]);

    const problems: string[] = [];
    for (const file of files) {
      try {
        const url = await uploadImage(file, "gallery");
        await addGalleryImage(url, user.uid, "", albumId);
      } catch {
        // One bad file must not abandon the rest of the batch.
        problems.push(file.name);
      }
      setDone((n) => n + 1);
    }

    setFailed(problems);
    setBusy(false);
    setTotal(0);
    setDone(0);
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        className={`btn-primary w-full cursor-pointer sm:w-fit ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <ImagePlus size={16} />
        {busy ? `Uploading ${done} of ${total}...` : "Add photos"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={handleFiles}
          className="hidden"
        />
      </label>

      {busy && (
        <p className="text-xs text-muted">
          Large photos are resized in your browser before uploading, so this can
          take a moment each. You can leave this tab open.
        </p>
      )}

      {failed.length > 0 && (
        <p className="text-sm text-red-600">
          {failed.length} file{failed.length === 1 ? "" : "s"} failed to upload:{" "}
          {failed.join(", ")}
        </p>
      )}
    </div>
  );
}
