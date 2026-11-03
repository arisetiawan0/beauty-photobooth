import type { FrameLayout } from "./layout";

// Printer paper: 102 x 152 mm (4R), portrait, edge to edge.
// Frames designed full-bleed for this page print without borders; artwork with a
// different aspect ratio (e.g. the old 105 x 148.5 mm grids) is scaled to cover and
// cropped evenly on the left/right sides.
export const PAPER_MM = { w: 102, h: 152 };

export function pageSizeFor(_layout: FrameLayout): string {
  return `${PAPER_MM.w}mm ${PAPER_MM.h}mm`;
}

/**
 * Prints one image scaled to cover the 102 x 152 mm page, via a hidden iframe so the
 * app's own layout is never printed. Chrome started with --kiosk-printing skips the dialog
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
    img { display: block; width: ${PAPER_MM.w}mm; height: ${PAPER_MM.h}mm; object-fit: cover; }
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
