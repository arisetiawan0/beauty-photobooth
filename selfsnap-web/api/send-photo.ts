import { createHash } from "node:crypto";

// POST /api/send-photo  { email, image }  ->  { url }
//
// Uploads the finished strip to Cloudinary (signed upload, secret stays on the server)
// and emails the link with Resend.
//
// Env (Vercel project settings, or selfsnap-web/.env.local for `npm run dev`):
//   RESEND_API_KEY, EMAIL_FROM,
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

const FOLDER = "selfsnap-photos";
const MAX_IMAGE_CHARS = 4_000_000; // ~3 MB JPEG as base64, under Vercel's 4.5 MB request limit
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Best-effort abuse guard (per function instance): 5 sends per IP per 10 minutes
const RATE_MAX = 5;
const RATE_WINDOW_MS = 10 * 60_000;
const hits = new Map<string, number[]>();

type Config = {
  resendKey: string;
  from: string;
  cloud: string;
  apiKey: string;
  apiSecret: string;
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function readConfig(): Config | null {
  const env = process.env;
  const config = {
    resendKey: env.RESEND_API_KEY ?? "",
    from: env.EMAIL_FROM ?? "",
    cloud: env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: env.CLOUDINARY_API_KEY ?? "",
    apiSecret: env.CLOUDINARY_API_SECRET ?? "",
  };
  return Object.values(config).every(Boolean) ? config : null;
}

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

async function uploadToCloudinary(image: string, config: Config): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Signed params sorted by name, then the API secret appended (Cloudinary signature rules)
  const signature = createHash("sha1")
    .update(`folder=${FOLDER}&timestamp=${timestamp}${config.apiSecret}`)
    .digest("hex");

  const form = new FormData();
  form.set("file", image);
  form.set("folder", FOLDER);
  form.set("timestamp", timestamp);
  form.set("api_key", config.apiKey);
  form.set("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${data.error?.message ?? "no url"}`);
  }
  return data.secure_url;
}

function emailHtml(url: string, downloadUrl: string) {
  return `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#FFF7FB;font-family:Helvetica,Arial,sans-serif;color:#2A1520">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:24px;padding:32px 24px">
          <tr><td align="center" style="font-size:22px;font-weight:800;color:#F0248F;letter-spacing:-0.5px">beauty <span style="font-size:11px;font-weight:600;letter-spacing:3px;color:#7D6672">PHOTOBOOTH</span></td></tr>
          <tr><td align="center" style="padding-top:20px;font-size:22px;font-weight:700">Fotomu sudah jadi!</td></tr>
          <tr><td align="center" style="padding-top:8px;font-size:15px;line-height:1.5;color:#7D6672">Terima kasih sudah mampir ke photobooth beauty. Simpan fotomu lewat tombol di bawah.</td></tr>
          <tr><td align="center" style="padding-top:24px"><img src="${url}" alt="Photo strip beauty" width="200" style="display:block;width:200px;max-width:100%;border-radius:12px"></td></tr>
          <tr><td align="center" style="padding-top:28px">
            <a href="${downloadUrl}" style="display:inline-block;background:#F0248F;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px">Download foto</a>
          </td></tr>
          <tr><td align="center" style="padding-top:16px;font-size:13px;color:#7D6672">Atau buka: <a href="${url}" style="color:#D6157B">${url}</a></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function sendEmail(to: string, url: string, config: Config) {
  // fl_attachment makes Cloudinary serve the file as a download
  const downloadUrl = url.replace("/image/upload/", "/image/upload/fl_attachment/");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject: "Foto photobooth beauty kamu sudah jadi",
      html: emailHtml(url, downloadUrl),
      text: `Fotomu sudah jadi! Download di sini: ${downloadUrl}`,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend failed (${res.status}): ${detail}`);
  }
}

export async function POST(request: Request) {
  const config = readConfig();
  if (!config) {
    console.error("send-photo: missing env vars (RESEND_API_KEY, EMAIL_FROM, CLOUDINARY_*)");
    return json({ error: "Fitur email belum diatur di server." }, 500);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return json({ error: "Terlalu banyak permintaan. Coba lagi beberapa menit lagi." }, 429);
  }

  let body: { email?: unknown; image?: unknown };
  try {
    body = ((await request.json()) ?? {}) as typeof body;
  } catch {
    return json({ error: "Format permintaan tidak valid." }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const image = String(body.image ?? "");

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "Alamat email tidak valid." }, 400);
  }
  if (!image.startsWith("data:image/jpeg;base64,") || image.length > MAX_IMAGE_CHARS) {
    return json({ error: "Foto tidak valid atau terlalu besar." }, 400);
  }

  try {
    const url = await uploadToCloudinary(image, config);
    await sendEmail(email, url, config);
    return json({ url });
  } catch (err) {
    console.error("send-photo:", err);
    return json({ error: "Gagal mengirim email. Coba lagi sebentar." }, 502);
  }
}
