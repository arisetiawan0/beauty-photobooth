<template>
  <header class="grid grid-cols-[3rem_1fr_3rem] items-center gap-3">
    <button
      v-if="backTo"
      type="button"
      class="icon-btn"
      :class="{ 'icon-btn-dark': tone === 'dark' }"
      :disabled="disabled"
      aria-label="Kembali"
      @click="router.push(backTo)"
    >
      <PhArrowLeft :size="20" weight="bold" />
    </button>
    <span v-else aria-hidden="true"></span>

    <div class="flex flex-col items-center gap-2.5">
      <BrandMark :tone="tone" />
      <div v-if="step" class="flex items-center gap-1.5" :aria-label="`Langkah ${step} dari ${STEPS.length}`">
        <span
          v-for="(label, i) in STEPS"
          :key="label"
          class="h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out-soft"
          :class="[
            i + 1 === step ? 'w-6' : 'w-1.5',
            i + 1 <= step
              ? 'bg-brand-500'
              : tone === 'dark'
                ? 'bg-white/20'
                : 'bg-ink-900/15',
          ]"
          :title="label"
        ></span>
      </div>
    </div>

    <div class="flex justify-end">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { PhArrowLeft } from "@phosphor-icons/vue";
import BrandMark from "./BrandMark.vue";

const STEPS = ["Atur", "Foto", "Simpan"];

defineProps<{
  backTo?: string;
  step?: 1 | 2 | 3;
  tone?: "light" | "dark";
  disabled?: boolean;
}>();

const router = useRouter();
</script>
