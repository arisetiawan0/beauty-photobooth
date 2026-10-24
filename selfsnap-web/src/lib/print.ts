import type { FrameLayout } from "./layout";

// Printer paper orientation. "landscape": strips print on a 148 x 53 mm page, turned sideways.
export const PRINT_ORIENTATION: "portrait" | "landscape" = "landscape";

// How a portrait strip turns on landscape paper.
// -90 = counter-clockwise (header on the left), 90 = clockwise (header on the right).
// If prints come out upside down on your printer, flip the sign.
export const PRINT_ROTATION: 90 | -90 = -90;

// Strip frames are 1017x2840 = exactly 53 x 148 mm
const STRIP_MM = { w: 53, h: 148 };

function isStrip(layout: FrameLayout) {
  return Math.abs(layout.canvasW / layout.canvasH - STRIP_MM.w / STRIP_MM.h) < 0.01;
}

export function pageSizeFor(layout: FrameLayout): string {
  if (PRINT_ORIENTATION === "landscape") {
    return isStrip(layout) ? `${STRIP_MM.h}mm ${STRIP_MM.w}mm` : "landscape";
  }
  return isStrip(layout) ? `${STRIP_MM.w}mm ${STRIP_MM.h}mm` : "auto";
}

// Rotates the image by 90 degrees on a canvas (pixel-exact, no CSS transforms in print)
export async function rotateImage(blob: Blob, degrees: 90 | -90): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.height;
  canvas.height = bitmap.width;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Rotate failed"))), "image/png")
  );
}

/**
 * Prints one image edge to edge on its own page size, via a hidden iframe so the app's
 * own layout is never printed. Chrome started with --kiosk-printing skips the dialog
 * and prints straight to the default printer.
 */
export async function printImage(blob: Blob, layout: FrameLayout): Promise<void> {
  const portraitImage = layout.canvasW < layout.canvasH;
  const printable =
    PRINT_ORIENTATION === "landscape" && portraitImage ? await rotateImage(blob, PRINT_ROTATION) : blob;

  const url = URL.createObjectURL(printable);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.tabIndex = -1;
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  iframe.srcdoc = `<!doctype html><html><head><style>
    @page { size: ${pageSizeFor(layout)}; margin: 0; }
    html, body { margin: 0; padding: 0; }
    img { display: block; width: 100vw; height: 100vh; object-fit: contain; }
  </style></head><body><img src="${url}" alt=""></body></html>`;

  const loaded = new Promise<void>((resolve) => (iframe.onload = () => resolve()));
  document.body.appendChild(iframe);
  await loaded;

  const win = iframe.contentWindow;
  const img = iframe.contentDocument?.querySelector("img");
  if (!win || !img) {
    iframe.remove();
    URL.revokeObjectURL(url);
    throw new Error("Print frame not ready");
  }
  await img.decode().catch(() => undefined);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
    URL.revokeObjectURL(url);
  };
  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 5 * 60_000); // Safari may not fire afterprint

  win.focus();
  win.print();
}
