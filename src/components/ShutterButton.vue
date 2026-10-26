<template>
  <button
    type="button"
    class="group grid size-[84px] shrink-0 place-items-center rounded-full ring-4 ring-white/90 transition-[transform,opacity] duration-150 ease-out-soft focus-visible:outline-none focus-visible:ring-brand-300 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40"
    :disabled="disabled"
    :aria-label="running ? 'Sedang memotret' : 'Mulai memotret'"
    @click="emit('press')"
  >
    <span
      class="grid size-[68px] place-items-center rounded-full bg-brand-500 transition-[background-color] duration-150 ease-out-soft group-hover:bg-brand-400"
    >
      <PhCamera :size="30" weight="fill" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { PhCamera } from "@phosphor-icons/vue";

defineProps<{ disabled?: boolean; running?: boolean }>();
const emit = defineEmits<{ press: [] }>();
</script>
