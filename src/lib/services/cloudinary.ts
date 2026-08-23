const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadImage(file: File, folder?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
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
