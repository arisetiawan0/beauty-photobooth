<script setup lang="ts">
// Decorative emoji stickers floating around the viewfinder edges during the
// shoot. Purely ambient: pointer-events-none, hidden while the sequence runs
// so they never distract mid-countdown, and disabled for reduced motion.
import { computed } from "vue";

const props = defineProps<{
  running: boolean;
}>();

// position = anchor point around the viewfinder (%), spin/drift vary per sticker
const STICKERS: { emoji: string; x: number; y: number; size: number; delay: number; dur: number }[] = [
  { emoji: "✨", x: 4, y: 12, size: 28, delay: 0, dur: 6 },
  { emoji: "💖", x: 94, y: 18, size: 32, delay: 1.2, dur: 7 },
  { emoji: "🌸", x: 8, y: 78, size: 26, delay: 2.1, dur: 6.5 },
  { emoji: "✌️", x: 92, y: 82, size: 30, delay: 0.6, dur: 7.5 },
  { emoji: "💫", x: 50, y: 4, size: 24, delay: 1.7, dur: 6.2 },
  { emoji: "🎀", x: 30, y: 94, size: 26, delay: 2.8, dur: 7.2 },
  { emoji: "😊", x: 72, y: 6, size: 26, delay: 0.9, dur: 6.8 },
];

const visible = computed(() => !props.running);
</script>

<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden">
    <template v-if="visible">
      <span
        v-for="(s, i) in STICKERS"
        :key="i"
        class="motion-safe:animate-sticker absolute select-none"
        :style="{
          left: `${s.x}%`,
          top: `${s.y}%`,
          fontSize: `${s.size}px`,
          animationDelay: `${s.delay}s`,
          animationDuration: `${s.dur}s`,
        }"
      >
        {{ s.emoji }}
      </span>
    </template>
  </div>
</template>
