export type Rect = { x: number; y: number; w: number; h: number };

export type FrameFooter = "default" | "compact" | "none";

export type FrameLayout = {
  canvasW: number;
  canvasH: number;
  slots: Rect[];
  footer: FrameFooter;
};

// Default 2x2 grid layout — MUST stay in sync with ResultView/BoothView consts
export function grid4Layout(): FrameLayout {
  return {
    canvasW: 1080,
    canvasH: 1920,
    slots: compute4GridSlots(1080, 1920, {
      outerPad: 44,
      gap: 26,
      headerH: 140,
      footerH: 220,
      ratioW: 3,
      ratioH: 4,
    }),
    footer: "default",
  };
}

// Beauty Warehouse Sale 2026 — 3-slot strip, native 1017x2840 (= 53x148 mm ratio).
// Slot rects measured from the artwork's photo boxes.
export function strip3Layout(): FrameLayout {
  return {
    canvasW: 1017,
    canvasH: 2840,
    slots: [
      { x: 79, y: 743, w: 859, h: 603 },
      { x: 79, y: 1408, w: 859, h: 603 },
      { x: 79, y: 2072, w: 859, h: 603 },
    ],
    footer: "none", // strip artwork already carries branding; no printed date
  };
}

// Parse a layout payload persisted in sessionStorage (selfsnap.settings.layout)
export function resolveLayout(raw: unknown): FrameLayout {
  const l = raw as Partial<FrameLayout> | undefined;
  if (
    l &&
    typeof l.canvasW === "number" &&
    typeof l.canvasH === "number" &&
    Array.isArray(l.slots) &&
    l.slots.length > 0 &&
    l.slots.every(
      (s) =>
        typeof s?.x === "number" &&
        typeof s?.y === "number" &&
        typeof s?.w === "number" &&
        typeof s?.h === "number"
    )
  ) {
    return {
      canvasW: l.canvasW,
      canvasH: l.canvasH,
      slots: l.slots,
      footer: (["default", "compact", "none"] as const).includes(l.footer as FrameFooter)
        ? (l.footer as FrameFooter)
        : "default",
    };
  }
  return grid4Layout();
}

export function compute4GridSlots(
  canvasW: number,
  canvasH: number,
  opts?: {
    outerPad?: number; // padding from edges
    gap?: number; // gap between slots
    ratioW?: number; // default 3
    ratioH?: number; // default 4
    headerH?: number; // reserved top area (logo space)
    footerH?: number; // reserved bottom area (text space)
  }
): Rect[] {
  const outerPad = opts?.outerPad ?? Math.round(canvasW * 0.04);
  const gap = opts?.gap ?? Math.round(canvasW * 0.025);
  const ratioW = opts?.ratioW ?? 3;
  const ratioH = opts?.ratioH ?? 4;

  const headerH = opts?.headerH ?? Math.round(canvasH * 0.06);
  const footerH = opts?.footerH ?? Math.round(canvasH * 0.07);

  const usableW = canvasW - outerPad * 2;
  const usableH = canvasH - outerPad * 2 - headerH - footerH;

  const cellW = (usableW - gap) / 2;
  const cellH = (usableH - gap) / 2;

  // Fit a 3:4 rect inside each cell
  const cellRatio = cellW / cellH;
  const targetRatio = ratioW / ratioH;

  let shotW: number, shotH: number;
  if (cellRatio > targetRatio) {
    shotH = cellH;
    shotW = shotH * targetRatio;
  } else {
    shotW = cellW;
    shotH = shotW / targetRatio;
  }

  const gridLeft = outerPad + (usableW - (shotW * 2 + gap)) / 2;
const gridTop = outerPad + headerH + Math.round(canvasH * 0.006);

  return [
    { x: gridLeft, y: gridTop, w: shotW, h: shotH },
    { x: gridLeft + shotW + gap, y: gridTop, w: shotW, h: shotH },
    { x: gridLeft, y: gridTop + shotH + gap, w: shotW, h: shotH },
    { x: gridLeft + shotW + gap, y: gridTop + shotH + gap, w: shotW, h: shotH },
  ];
}
