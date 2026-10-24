import type { FrameLayout } from "./layout";

// Strip frames are 1017x2840 = exactly 53 x 148 mm
const STRIP_MM = { w: 53, h: 148 };

export function pageSizeFor(layout: FrameLayout): string {
  const ratio = layout.canvasW / layout.canvasH;
  return Math.abs(ratio - STRIP_MM.w / STRIP_MM.h) < 0.01 ? `${STRIP_MM.w}mm ${STRIP_MM.h}mm` : "auto";
}

/**
 * Prints one image edge to edge on its own page size, via a hidden iframe so the app's
 * own layout is never printed. Chrome started with --kiosk-printing skips the dialog
 * and prints straight to the default printer.
 */
export async function printImage(blob: Blob, layout: FrameLayout): Promise<void> {
  const url = URL.createObjectURL(blob);
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
