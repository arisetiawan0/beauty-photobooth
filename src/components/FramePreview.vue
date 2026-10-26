<script setup lang="ts">
import type { Frame } from "@/lib/frames";
import { filterCss, type FilterMode } from "@/lib/filters";

// Settings-page preview: the real frame with a sample photo clipped into each
// slot at the exact rects from the frame's layout — the same coordinates the
// result composition uses. Only the sample photos take the filter; the frame
// artwork never does, matching real output.
const props = defineProps<{
  frame: Frame;
  filter: FilterMode;
}>();
</script>

<template>
  <!-- Ratio box mimics object-contain: the artwork and slot overlays share one coordinate space -->
  <div
    class="relative max-h-full max-w-full self-center justify-self-center"
    :style="{ aspectRatio: `${frame.layout.canvasW} / ${frame.layout.canvasH}`, width: `${100 * (frame.layout.canvasW / Math.max(frame.layout.canvasW, frame.layout.canvasH))}%` }"
  >
    <img
      :src="frame.url"
      :alt="frame.name"
      class="absolute inset-0 h-full w-full rounded-[6px] object-fill drop-shadow-[0_12px_24px_rgb(140_15_82_/_0.18)]"
    />
    <div
      v-for="(slot, i) in frame.layout.slots"
      :key="i"
      class="absolute overflow-hidden"
      :style="{
        left: `${(slot.x / frame.layout.canvasW) * 100}%`,
        top: `${(slot.y / frame.layout.canvasH) * 100}%`,
        width: `${(slot.w / frame.layout.canvasW) * 100}%`,
        height: `${(slot.h / frame.layout.canvasH) * 100}%`,
      }"
    >
      <img
        src="/sample-photo.svg"
        alt=""
        class="h-full w-full object-cover"
        :style="{ filter: filterCss(filter) }"
      />
    </div>
  </div>
</template>
