import { strip3Layout, grid4Layout, grid6Layout, parseLayout, type FrameLayout } from "./layout";
export type Frame = {
  id: string;
  name: string;
  url: string;
  layout: FrameLayout;
};

// Cloudinary tag -> photo layout. Tag a frame in the Cloudinary Media Library with ONE of these.
// A new frame design with different photo positions needs a new entry here.
export const FRAME_TAGS: Record<string, () => FrameLayout> = {
  "selfsnap-strip3": strip3Layout, // 3-photo strip (Warehouse Sale template)
  "selfsnap-grid4": grid4Layout, // 2x2 grid
  "selfsnap-grid6": grid6Layout, // 2x3 grid (Warehouse Sale 2026)
};

// Layout -> tag used when uploading a frame from the app. Slot count must match
// one of the known layouts; custom irregular layouts stay local-only.
export function layoutTag(layout: FrameLayout): string | null {
  const n = layout.slots.length;
  if (n === 3) return "selfsnap-strip3";
  if (n === 4) return "selfsnap-grid4";
  if (n === 6) return "selfsnap-grid6";
  return null;
}

// Bundled with the app (public/local-frames) — works without Cloudinary.
// A local frame is hidden when a Cloudinary frame has the same name.
export const LOCAL_FRAMES: Frame[] = [
  {
    id: "local/warehouse-sale-2026-biru",
    name: "WH Biru",
    url: "/local-frames/warehouse-sale-2026-biru.png",
    layout: grid6Layout(),
  },
  {
    id: "local/warehouse-sale-2026-kuning",
    name: "WH Kuning",
    url: "/local-frames/warehouse-sale-2026-kuning.png",
    layout: grid6Layout(),
  },
  {
    id: "local/warehouse-sale-2026-pink",
    name: "WH Pink",
    url: "/local-frames/warehouse-sale-2026-pink.png",
    layout: grid6Layout(),
  },
];

type CloudinaryResource = {
  public_id: string;
  version: number;
  format: string;
  created_at?: string;
  context?: { custom?: Record<string, string> };
};

// ---------- Custom frames (uploaded on this device, stored in localStorage) ----------

type StoredCustomFrame = {
  id: string;
  name: string;
  // Full data URL of the frame PNG (persisted)
  url: string;
  layout: FrameLayout;
};

const CUSTOM_KEY = "selfsnap.customFrames";

export function loadCustomFrames(): Frame[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((f: StoredCustomFrame) => {
        const layout = parseLayout(f?.layout);
        if (!layout || typeof f?.id !== "string" || typeof f?.name !== "string" || typeof f?.url !== "string") {
          return null;
        }
        return { id: f.id, name: f.name, url: f.url, layout } satisfies Frame;
      })
      .filter((f): f is Frame => f !== null);
  } catch {
    return [];
  }
}

export function saveCustomFrame(frame: Frame): Frame[] {
  const frames = loadCustomFrames().filter((f) => f.id !== frame.id);
  frames.unshift(frame);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(frames));
  } catch (e) {
    // Data URLs are large; quota errors mean the PNGs must shrink
    throw new Error("Penyimpanan browser penuh. Coba gambar frame yang lebih kecil.");
  }
  return frames;
}

export function deleteCustomFrame(id: string): Frame[] {
  const frames = loadCustomFrames().filter((f) => f.id !== id);
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(frames));
  } catch {}
  return frames;
}

// "frames/warehouse-sale-pink_x8k2qz" -> "Warehouse Sale Pink"
function nameFromPublicId(publicId: string): string {
  const base = (publicId.split("/").pop() ?? publicId).replace(/_[a-z0-9]{6}$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function listTag(cloud: string, tag: string): Promise<CloudinaryResource[]> {
  const res = await fetch(`https://res.cloudinary.com/${cloud}/image/list/${tag}.json`, {
    cache: "no-store",
  });
  if (res.status === 404) return []; // no image has this tag yet
  if (res.status === 401 || res.status === 403) {
    throw new Error('Cloudinary: turn off "Resource list" under Settings > Security > Restricted media types');
  }
  if (!res.ok) throw new Error(`Cloudinary list error: ${res.status}`);
  const data = await res.json();
  return data.resources ?? [];
}

// Frames uploaded to Cloudinary, newest first. Changes show up within ~60s (Cloudinary list cache).
export async function fetchCloudinaryFrames(): Promise<Frame[]> {
  const cloud = import.meta.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) return [];

  const lists = await Promise.all(
    Object.entries(FRAME_TAGS).map(async ([tag, layout]) => ({ layout, resources: await listTag(cloud, tag) }))
  );

  const seen = new Set<string>();
  const items: (Frame & { createdAt: string })[] = [];
  lists.forEach(({ layout, resources }) => {
    for (const r of resources) {
      if (seen.has(r.public_id)) continue; // tagged twice: first tag wins
      seen.add(r.public_id);
      const path = r.public_id.split("/").map(encodeURIComponent).join("/");
      items.push({
        id: `cloudinary/${r.public_id}`,
        name: r.context?.custom?.caption || nameFromPublicId(r.public_id),
        // Original file, versioned URL so a replaced frame is never served stale
        url: `https://res.cloudinary.com/${cloud}/image/upload/v${r.version}/${path}.${r.format}`,
        layout: layout(),
        createdAt: r.created_at ?? "",
      });
    }
  });

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ createdAt: _createdAt, ...frame }) => frame);
}

export type FrameList = { frames: Frame[]; error: string | null };

let cached: Promise<FrameList> | null = null;

// Local + Cloudinary frames, fetched once per page load and shared by all views.
// Local frames stay visible when Cloudinary fails, and hide once uploaded under the same name.
export function loadFrames(): Promise<FrameList> {
  cached ??= (async () => {
    let remote: Frame[] = [];
    let error: string | null = null;
    try {
      remote = await fetchCloudinaryFrames();
    } catch (e: any) {
      error = e?.message ?? "Failed to load frames.";
      console.warn(error);
    }
    const remoteNames = new Set(remote.map((f) => f.name.toLowerCase()));
    const local = LOCAL_FRAMES.filter((lf) => !remoteNames.has(lf.name.toLowerCase()));
    return { frames: [...local, ...remote], error };
  })();
  return cached;
}
