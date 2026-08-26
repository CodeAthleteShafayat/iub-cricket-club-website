const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** Longest edge, in px, an upload is scaled down to. Well above anything the
 *  site renders (the homepage carousel is the biggest consumer at 1600w), so
 *  this costs no visible quality. */
const DEFAULT_MAX_DIMENSION = 1600;
/** Profile photos never render larger than ~128px, so they can go much smaller. */
export const PROFILE_PHOTO_MAX_DIMENSION = 800;

const JPEG_QUALITY = 0.82;
/** Below this, re-encoding costs more time than it saves and can even grow the file. */
const SKIP_COMPRESSION_BELOW_BYTES = 200 * 1024;

/**
 * Downscale + re-encode in the browser before uploading.
 *
 * A modern phone camera produces 3-6 MB files (3024x4032 is typical), and
 * uploading that raw is what made form submits take 10+ seconds on mobile
 * data. transformImage() only shrinks images for *display* -- it does nothing
 * for upload latency or stored bytes, since Cloudinary still receives and
 * keeps the full original.
 *
 * Never throws: any failure falls back to uploading the original file, since
 * a slow upload is much better than a broken one.
 */
async function compressImage(
  file: File,
  maxDimension: number
): Promise<File | Blob> {
  if (!file.type.startsWith("image/")) return file;
  // Re-encoding an animated GIF would flatten it to a single frame.
  if (file.type === "image/gif") return file;
  if (file.size <= SKIP_COMPRESSION_BELOW_BYTES) return file;
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap | undefined;
  try {
    // imageOrientation: "from-image" applies the EXIF rotation phone cameras
    // rely on -- without it, portrait photos upload sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

    const longestEdge = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxDimension / longestEdge);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // JPEG has no alpha channel; without this, transparent PNG areas turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );

    // If the re-encode didn't actually help, keep the original.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

export async function uploadImage(
  file: File,
  folder?: string,
  options?: { maxDimension?: number }
): Promise<string> {
  const prepared = await compressImage(
    file,
    options?.maxDimension ?? DEFAULT_MAX_DIMENSION
  );

  const formData = new FormData();
  formData.append("file", prepared);
  formData.append("upload_preset", UPLOAD_PRESET ?? "");
  if (folder) formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  const data = await response.json();
  return data.secure_url as string;
}

interface TransformOptions {
  width: number;
  height?: number;
  crop?: "fill" | "limit";
}

// Cloudinary can resize/compress on the fly via the URL itself, no re-upload
// needed. Without this, every view downloads the full original file (which
// can be several MB from a phone camera) even for a small thumbnail.
export function transformImage(url: string, options: TransformOptions): string {
  if (!url.includes("/upload/")) return url;
  const { width, height, crop = "fill" } = options;
  const parts = ["q_auto", "f_auto", `w_${width}`];
  if (height) parts.push(`h_${height}`);
  parts.push(`c_${crop}`);
  return url.replace("/upload/", `/upload/${parts.join(",")}/`);
}
