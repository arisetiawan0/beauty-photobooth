# 📸 SelfSnap

**SelfSnap** is a browser-based photo booth that lets users take a **4-shot photo strip**, preview it in real time, and download or share the final image — all **without uploading or storing photos on a server**.

It’s designed to feel like a real photo booth: fixed framing, timed captures, no retakes — optimized for **mobile and desktop**.

### [Try It Now](https://selfsnap.darladavid.com/)
### [Watch the Video](https://youtu.be/dKt2zKtm6m0)
### [Read More](https://builder.aws.com/content/38xEmQgKgi1OXvVR6diRaDkJqsz/aws-ai-a-killer-combo-to-build-an-app-in-one-day)

---

## ✨ Features

- 📱 Mobile-first photo booth experience
- 🖼️ Live **2×2 grid preview** with exact framing
- ⏱️ Timer-based capture (no retakes)
- 🪞 Mirrored selfie preview
- 📤 Download & Share (Web Share API on supported devices)
- 🖼️ Frames managed in Cloudinary — upload a new frame, it appears in the app
- 🔒 Privacy-first: photos are uploaded only when the visitor chooses Email

---

## 🧠 How It Works

1. User selects a frame and settings
2. Camera preview shows **only the active capture box**
3. Photos are captured sequentially (4 shots)
4. A final image is composed using `<canvas>`
5. User downloads or shares the result
6. Images never leave the browser session

---

## 🏗️ Tech Stack

### Frontend
- Vue 3 (Composition API)
- TypeScript
- Vite
- Tailwind CSS
- HTML Canvas API
- Web Media APIs (`getUserMedia`)

### Hosting / Media
- Vercel (static hosting)
- Cloudinary (frame images, listed client-side by tag)
- Resend (email) via one Vercel Function, no database

---

## 🧮 Layout System

- Final canvas size: **1080 × 1920**
- Grid layout: **2 × 2**
- Each photo: **3:4 aspect ratio**
- Shared math via `compute4GridSlots()`
- Booth preview and Result composition use **the same coordinates**

This guarantees **what you see in the booth is exactly what you get in the final image**.

---

## 🔒 Privacy

- Photos stay in the browser session (memory + `sessionStorage`) by default.
- A photo is uploaded **only** when the visitor chooses **Email**: the strip goes to the
  Cloudinary folder `selfsnap-photos` and the link is emailed to them.
- Closing the tab clears everything else.

## 💻 Run locally

```bash
cd selfsnap-web
npm install
npm run dev
```

## 🖼️ Frames (Cloudinary)

### One-time setup

1. Put your **cloud name** (Cloudinary Console > Dashboard) in `selfsnap-web/.env.local`:
   `CLOUDINARY_CLOUD_NAME=your-cloud-name` (see `.env.example`; the same file holds the email keys)
2. Cloudinary Console > **Settings > Security** > *Restricted media types*: **uncheck "Resource list"**.
   This lets the app read the list of frames by tag (it only exposes images that carry a tag).

### Add, replace or remove a frame

1. Upload the PNG in the Cloudinary **Media Library**.
2. Give it **one** tag that says where the photos go:

   | Tag | Layout |
   |-----|--------|
   | `selfsnap-strip3` | 3-photo strip (Warehouse Sale template, 1017×2840) |
   | `selfsnap-grid4`  | 2×2 grid (1080×1920) |

3. Done. The frame shows up in the app within ~60 seconds. No redeploy needed.

- **Name in the app:** the asset's *Title* (caption) if set, otherwise its file name.
- **Replace:** overwrite the asset or upload a new one. **Remove:** delete it or remove its tag.
- **New frame design** with different photo positions: add a layout in
  `selfsnap-web/src/lib/layout.ts` and a tag for it in `FRAME_TAGS` (`src/lib/frames.ts`), then redeploy.

### Local frames

Frames in `selfsnap-web/public/local-frames/` (listed in `src/lib/frames.ts`) are bundled with the
app and work without Cloudinary. A local frame is hidden once a Cloudinary frame has the same name.

## 🖨️ Print

**Cetak** prints the strip edge to edge, sized for the printer paper set in
`selfsnap-web/src/lib/print.ts`:

| Setting | Value | Result |
|---------|-------|--------|
| `PRINT_ORIENTATION` | `"landscape"` (default) | 148 × 53 mm page, strip turned sideways |
| | `"portrait"` | 53 × 148 mm page, strip upright |
| `PRINT_ROTATION` | `-90` (default) | landscape: strip header on the left |
| | `90` | landscape: strip header on the right (use if prints come out upside down) |

The strip is rotated on a canvas before printing, so the output is pixel-exact.
Grid frames use the printer's own paper size (rotated to fit when landscape).

- Add a custom paper size of 148 × 53 mm (landscape) in the printer driver and pick it once in the print dialog.
- For a kiosk with no print dialog, start Chrome with `--kiosk-printing`: it prints straight to the
  default printer with the last used settings.

## ✉️ Email (Resend + Cloudinary)

**Email** sends a download link. `api/send-photo.ts` (a Vercel Function) uploads the strip to
Cloudinary with a signed upload and sends the email with Resend. Secrets never reach the browser.

1. Copy `selfsnap-web/.env.example` to `selfsnap-web/.env.local` and fill it in:
   - `RESEND_API_KEY`: from resend.com > API Keys
   - `EMAIL_FROM`: a sender on a **domain verified in Resend**, e.g. `beauty photobooth <foto@beauty.co.id>`.
     Without a verified domain, `onboarding@resend.dev` only delivers to your own Resend account email.
   - `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Cloudinary Console > Settings > API Keys
2. Set the same variables in Vercel: Project > Settings > Environment Variables.

`npm run dev` serves `/api/*` locally (small Vite plugin in `vite.config.ts`), so email works in dev too.
Abuse guards: email/image validation, JPEG only up to ~3 MB, 5 sends per IP per 10 minutes.

## 🚀 Deploy (Vercel)

```bash
cd selfsnap-web
npx vercel --prod
```

The first run asks to link a Vercel project (framework: Vite, output: `dist`).
`vercel.json` rewrites all routes to `index.html` so deep links like `/booth` work.
