// Cloudinary unsigned upload for user-created frames.
// Requires an UNSIGNED upload preset (Dashboard → Settings → Upload → Upload presets).
// Anyone with the cloud name can upload through it — acceptable for this booth tool.

export const CLOUDINARY_PRESET = "selfsnap_frames";

export type CloudinaryUploadResult = {
  publicId: string;
  url: string;
  version: number;
};

export function cloudinaryCloudName(): string {
  return import.meta.env.CLOUDINARY_CLOUD_NAME ?? "";
}

/**
 * Upload an image data URL to Cloudinary as an unauthenticated multipart POST.
 * `tags` carries the layout tag (selfsnap-strip3 / selfsnap-grid4 / selfsnap-grid6)
 * so fetchCloudinaryFrames() knows which photo layout the artwork uses.
 */
export async function uploadFrameToCloudinary(
  dataUrl: string,
  opts: { publicId: string; caption: string; tags: string[] }
): Promise<CloudinaryUploadResult> {
  const cloud = cloudinaryCloudName();
  if (!cloud) throw new Error("Cloudinary belum dikonfigurasi (CLOUDINARY_CLOUD_NAME kosong).");

  const form = new FormData();
  form.append("file", dataUrl);
  form.append("upload_preset", CLOUDINARY_PRESET);
  form.append("public_id", opts.publicId);
  form.append("context", `caption=${opts.caption}`);
  form.append("tags", opts.tags.join(","));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.public_id) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Upload Cloudinary gagal: ${msg}`);
  }
  return { publicId: data.public_id as string, url: data.secure_url as string, version: data.version as number };
}
