<template>
  <span class="inline-flex items-center gap-2" :class="tone === 'dark' ? 'text-white' : 'text-ink-900'">
    <span class="relative text-[22px] font-extrabold leading-none tracking-[-0.045em] text-brand-500">
      beauty
      <PhSparkle
        :size="12"
        weight="fill"
        class="absolute -right-3 -top-1.5 text-sun drop-shadow-[0_1px_0_rgb(176_15_100_/_0.35)]"
        aria-hidden="true"
      />
    </span>
    <span
      class="ml-2 text-[11px] font-semibold uppercase leading-none tracking-[0.2em]"
      :class="tone === 'dark' ? 'text-white/60' : 'text-ink-500'"
    >
      photobooth
    </span>
  </span>
</template>

<script setup lang="ts">
import { PhSparkle } from "@phosphor-icons/vue";

defineProps<{ tone?: "light" | "dark" }>();
</script>
