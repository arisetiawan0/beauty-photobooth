<template>
  <!-- The chosen frame with captured shots filled in; shows progress, not the live camera -->
  <div
    class="relative overflow-hidden rounded-[12px] bg-white/5 ring-1 ring-white/10"
    :style="{ aspectRatio: `${layout.canvasW} / ${layout.canvasH}` }"
  >
    <img v-if="frameUrl" :src="frameUrl" alt="" class="absolute inset-0 h-full w-full object-cover" />

    <div v-for="(slot, i) in layout.slots" :key="i" class="absolute" :style="pct(slot)">
      <img v-if="shots[i]" :src="shots[i]" alt="" class="absolute inset-0 h-full w-full object-cover" />
      <div
        v-else
        class="absolute inset-0 grid place-items-center"
        :class="i === activeIndex ? 'bg-ink-900 ring-2 ring-inset ring-brand-400' : 'bg-white/45'"
      >
        <PhCamera v-if="i === activeIndex" :size="compact ? 10 : 18" weight="fill" class="text-white" />
        <span v-else-if="!compact" class="text-sm font-bold tabular-nums text-ink-900/50">{{ i + 1 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCamera } from "@phosphor-icons/vue";
import type { FrameLayout, Rect } from "@/lib/layout";

const props = defineProps<{
  frameUrl: string;
  layout: FrameLayout;
  shots: string[];
  activeIndex: number;
  compact?: boolean;
}>();

function pct(s: Rect) {
  const { canvasW: W, canvasH: H } = props.layout;
  return {
    left: `${(s.x / W) * 100}%`,
    top: `${(s.y / H) * 100}%`,
    width: `${(s.w / W) * 100}%`,
    height: `${(s.h / H) * 100}%`,
  };
}
</script>
