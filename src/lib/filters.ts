// Single source of truth for photo filters. The CSS string is used in three places:
// the live camera preview (CSS), the settings swatches (CSS) and the capture canvas
// (ctx.filter). Filters are applied exactly once — at capture time in BoothView —
// so ResultView composes the already-filtered shots as-is.

export type FilterMode =
  | "none"
  | "soft"
  | "glow"
  | "warm"
  | "cool"
  | "bw"
  | "sepia"
  | "film";

export type FilterDef = { value: FilterMode; label: string; css: string };

// Order = display order in Settings. Skin-friendly combos first (softening and
// brightening over harsh color shifts) for a beauty photobooth.
export const FILTERS: FilterDef[] = [
  { value: "none", label: "Normal", css: "none" },
  { value: "soft", label: "Soft", css: "brightness(1.05) contrast(0.9) saturate(0.92)" },
  { value: "glow", label: "Glow", css: "brightness(1.12) contrast(0.94) saturate(1.06)" },
  { value: "warm", label: "Warm", css: "sepia(0.28) saturate(1.25) brightness(1.05) contrast(1.02)" },
  { value: "cool", label: "Cool", css: "saturate(0.9) brightness(1.06) contrast(1.04)" },
  { value: "bw", label: "Mono", css: "grayscale(1) contrast(1.08) brightness(1.02)" },
  { value: "sepia", label: "Sepia", css: "sepia(0.9) saturate(1.1)" },
  { value: "film", label: "Film", css: "sepia(0.4) contrast(1.12) saturate(0.78) brightness(1.03)" },
];

export const FILTER_MODES: FilterMode[] = FILTERS.map((f) => f.value);

export function isFilterMode(value: unknown): value is FilterMode {
  return FILTER_MODES.includes(value as FilterMode);
}

export function filterCss(mode: FilterMode): string {
  return FILTERS.find((f) => f.value === mode)?.css ?? "none";
}

export function filterLabel(mode: FilterMode): string {
  return FILTERS.find((f) => f.value === mode)?.label ?? "Normal";
}
