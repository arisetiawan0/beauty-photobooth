// Pick a footer text color that contrasts against the sampled canvas region.
export function pickTextColorFromRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): string {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.max(1, Math.floor(Math.min(w, ctx.canvas.width - sx)));
  const sh = Math.max(1, Math.floor(Math.min(h, ctx.canvas.height - sy)));

  let r = 0;
  let g = 0;
  let b = 0;

  try {
    const data = ctx.getImageData(sx, sy, sw, sh).data;
    const pixels = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
    }
    r /= pixels;
    g /= pixels;
    b /= pixels;
  } catch {
    // Tainted canvas (e.g. cross-origin frame) — fall back to dark text.
    return "#111111";
  }

  // YIQ perceived brightness; dark text on light region, white otherwise.
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#111111" : "#FFFFFF";
}
