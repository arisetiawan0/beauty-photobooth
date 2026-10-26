<template>
  <main
    class="mx-auto grid min-h-[100dvh] w-full max-w-6xl grid-cols-1 items-center gap-6 px-5 pb-12 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-8 md:px-10 md:py-12"
  >
    <section class="flex flex-col">
      <BrandMark class="motion-safe:animate-rise" />

      <span
        class="mt-12 inline-flex w-fit items-center gap-2 rounded-full bg-white/80 py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-ink-700 shadow-soft motion-safe:animate-rise md:mt-16"
        style="animation-delay: 100ms"
      >
        <span class="grid size-6 place-items-center rounded-full bg-sun text-ink-900">
          <PhCamera :size="13" weight="bold" />
        </span>
        Frame eksklusif beauty
      </span>

      <h1
        class="mt-5 text-[44px] font-bold leading-[0.98] tracking-[-0.045em] motion-safe:animate-rise md:text-[68px]"
        style="animation-delay: 200ms"
      >
        Senyum, jepret,
        <span class="block text-brand-500">bawa pulang.</span>
      </h1>

      <p
        class="mt-5 max-w-[40ch] text-[17px] leading-relaxed text-ink-500 motion-safe:animate-rise"
        style="animation-delay: 300ms"
      >
        Pilih frame favoritmu, pose bareng teman, lalu simpan, cetak, atau kirim photo strip ke email.
        Foto hanya diunggah kalau kamu memilih kirim ke email.
      </p>

      <div class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 motion-safe:animate-rise" style="animation-delay: 400ms">
        <button type="button" class="btn btn-primary h-[60px] px-8 text-base" @click="router.push('/settings')">
          Mulai foto
          <PhArrowRight :size="20" weight="bold" />
        </button>
        <span v-if="frames.length" class="text-sm text-ink-500">
          <span class="font-semibold tabular-nums text-ink-900">{{ frames.length }}</span> frame siap dipakai
        </span>
      </div>

      <ol
        class="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-ink-900/10 pt-5 motion-safe:animate-rise"
        style="animation-delay: 500ms"
      >
        <li v-for="(step, i) in STEPS" :key="step">
          <span class="text-xs font-semibold tabular-nums text-brand-500">0{{ i + 1 }}</span>
          <p class="mt-1 text-sm font-medium leading-snug text-ink-700">{{ step }}</p>
        </li>
      </ol>
    </section>

    <!-- Frame showcase: the real frames, fanned like printed strips -->
    <section aria-hidden="true" class="relative h-[420px] md:h-[min(80dvh,660px)]">
      <!-- Each layer owns one transform: position, entrance, float -->
      <div
        v-for="(f, i) in showcase"
        :key="f.id"
        class="absolute left-1/2 top-1/2"
        :style="{
          transform: `translate(calc(-50% + ${placement[i]!.x}%), -50%)`,
          zIndex: placement[i]!.z,
        }"
      >
        <div class="motion-safe:animate-rise" :style="{ animationDelay: `${250 + i * 120}ms` }">
          <div
            class="motion-safe:animate-float"
            :style="{
              '--r': `${placement[i]!.r}deg`,
              transform: `rotate(${placement[i]!.r}deg)`,
              animationDelay: `${i * -2.3}s`,
            }"
          >
            <div class="rounded-[22px] bg-white p-2 shadow-lift">
              <img
                :src="f.url"
                alt=""
                class="block h-[340px] w-auto rounded-[14px] bg-blush-100 img-outline md:h-[min(64dvh,540px)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { PhArrowRight, PhCamera } from "@phosphor-icons/vue";
import BrandMark from "@/components/BrandMark.vue";
import { loadFrames, type Frame } from "@/lib/frames";

const STEPS = ["Pilih frame", "Pose saat hitungan mundur", "Simpan, cetak, atau email"];

// x = horizontal offset in % of the card's own width, r = tilt
const LAYOUTS: Record<number, { x: number; r: number; z: number }[]> = {
  1: [{ x: 0, r: -3, z: 1 }],
  2: [
    { x: -34, r: -7, z: 1 },
    { x: 34, r: 6, z: 2 },
  ],
  3: [
    { x: -62, r: -9, z: 1 },
    { x: 62, r: 8, z: 2 },
    { x: 0, r: -2, z: 3 },
  ],
};

const router = useRouter();
// Filled once local + Cloudinary frames are merged, so frames never swap mid-animation
const frames = ref<Frame[]>([]);

const showcase = computed(() => frames.value.slice(0, 3));
const placement = computed(() => LAYOUTS[Math.max(1, showcase.value.length)]!);

onMounted(async () => {
  frames.value = (await loadFrames()).frames;
});
</script>
