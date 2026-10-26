<template>
  <div class="mx-auto w-full max-w-6xl px-5 pb-44 pt-5 md:px-10 md:pb-16">
    <TopBar back-to="/" :step="1" />

    <div
      class="mt-8 grid gap-10 md:mt-12 md:grid-cols-[minmax(0,1fr)_360px] md:gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16"
    >
      <section class="min-w-0 space-y-10">
        <header class="motion-safe:animate-rise">
          <h1 class="text-[30px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[40px]">Atur sesi fotomu</h1>
          <p class="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-ink-500 md:text-base">
            Tiga langkah singkat: pilih frame, tentukan filter, lalu atur jeda antar pose.
          </p>
        </header>

        <!-- Frame -->
        <div class="motion-safe:animate-rise" style="animation-delay: 80ms">
          <div class="flex items-baseline justify-between gap-3">
            <h2 id="frame-label" class="field-label">Frame</h2>
            <span v-if="frames.length" class="text-[13px] tabular-nums text-ink-500">{{ frames.length }} pilihan</span>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="frame-label"
            class="-mx-5 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3"
          >
            <template v-if="loading && !frames.length">
              <div v-for="n in 3" :key="n" class="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-auto">
                <div class="rounded-[22px] bg-white p-1.5 shadow-soft">
                  <div class="skeleton h-60 rounded-[16px] md:h-56"></div>
                </div>
                <div class="skeleton mt-3 h-4 w-3/4 rounded-full"></div>
              </div>
            </template>

            <label
              v-for="f in frames"
              :key="f.id"
              class="group w-[44%] shrink-0 cursor-pointer snap-start sm:w-[30%] md:w-auto"
            >
              <input v-model="selectedFrameKey" type="radio" name="frame" :value="f.id" class="peer sr-only" />
              <div
                class="relative rounded-[22px] bg-white p-1.5 shadow-soft ring-2 transition-[box-shadow,transform] duration-150 ease-out-soft group-active:scale-[0.98] peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500/30"
                :class="f.id === selectedFrameKey ? 'ring-brand-500' : 'ring-transparent group-hover:ring-brand-200'"
              >
                <div class="flex h-60 items-center justify-center overflow-hidden rounded-[16px] bg-blush-100 p-3 md:h-56">
                  <img :src="f.url" :alt="f.name" loading="lazy" class="h-full w-full object-contain" />
                </div>
                <span
                  v-if="f.id === selectedFrameKey"
                  class="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-brand-500 text-white shadow-button motion-safe:animate-badge-in"
                >
                  <PhCheck :size="14" weight="bold" />
                </span>
              </div>
              <p class="mt-3 line-clamp-2 px-1 text-[15px] font-semibold leading-snug">{{ f.name }}</p>
              <p class="px-1 text-[13px] text-ink-500">{{ f.layout.slots.length }} pose</p>
            </label>
          </div>

          <p v-if="!loading && !frames.length" class="mt-4 rounded-[22px] bg-white p-5 text-sm text-ink-500 shadow-soft">
            Belum ada frame yang tersedia. Coba muat ulang halaman sebentar lagi.
          </p>
          <p v-else-if="loadError" class="mt-3 flex items-center gap-2 text-[13px] text-ink-500">
            <PhWarningCircle :size="16" class="shrink-0 text-brand-600" />
            Frame online gagal dimuat, menampilkan frame bawaan.
          </p>
        </div>

        <!-- Filter -->
        <div class="motion-safe:animate-rise" style="animation-delay: 160ms">
          <div class="flex items-baseline justify-between gap-3">
            <h2 id="filter-label" class="field-label">Filter</h2>
            <span v-if="selectedFrame" class="text-[13px] text-ink-500">Pratinjau mengikuti frame terpilih</span>
          </div>
          <div role="radiogroup" aria-labelledby="filter-label" class="segmented mt-4 max-w-md grid-cols-2 sm:grid-cols-4">
            <label v-for="opt in FILTERS" :key="opt.value" class="segment">
              <input v-model="filter" type="radio" name="filter" :value="opt.value" class="sr-only" />
              <span
                aria-hidden="true"
                class="relative block size-7 shrink-0 overflow-hidden rounded-[9px] bg-blush-100 ring-1 ring-black/10"
              >
                <img
                  v-if="selectedFrame"
                  :src="selectedFrame.url"
                  alt=""
                  class="h-full w-full scale-[1.7] object-cover object-top"
                  :style="{ filter: opt.css }"
                />
                <span
                  v-else
                  class="absolute inset-0 bg-gradient-to-br from-brand-400 to-sun"
                  :style="{ filter: opt.css }"
                ></span>
              </span>
              {{ opt.label }}
            </label>
          </div>
        </div>

        <!-- Timer -->
        <div class="motion-safe:animate-rise" style="animation-delay: 240ms">
          <div class="flex items-baseline justify-between gap-3">
            <h2 id="timer-label" class="field-label">Jeda antar pose</h2>
            <span class="text-[13px] text-ink-500">Waktu buat ganti pose</span>
          </div>
          <div role="radiogroup" aria-labelledby="timer-label" class="segmented mt-4 max-w-md grid-cols-4">
            <label v-for="s in TIMERS" :key="s" class="segment">
              <input v-model.number="timerSeconds" type="radio" name="timer" :value="s" class="sr-only" />
              <span class="tabular-nums">{{ s }}</span>
              <span class="-ml-1 text-[13px] opacity-60">dtk</span>
            </label>
          </div>
        </div>

        <!-- Consent (phones; on desktop it sits next to the button in the side panel) -->
        <label
          class="flex max-w-xl cursor-pointer items-start gap-3.5 rounded-[22px] bg-white p-4 shadow-soft motion-safe:animate-rise md:hidden"
          style="animation-delay: 320ms"
        >
          <input v-model="understand" type="checkbox" class="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-500" />
          <span>
            <span class="block text-[15px] font-semibold">Saya mengerti, tidak ada foto ulang</span>
            <span class="mt-1 block text-sm leading-relaxed text-ink-500">
              Simpan, cetak, atau kirim ke email sebelum menutup halaman.
            </span>
          </span>
        </label>
      </section>

      <!-- Desktop preview -->
      <aside class="hidden md:block">
        <div class="sticky top-6 space-y-4">
          <div class="rounded-[28px] bg-white p-3 shadow-lift">
            <div
              class="flex h-[min(520px,max(160px,calc(100dvh_-_27rem)))] items-center justify-center overflow-hidden rounded-[16px] bg-blush-100 p-4"
            >
              <Transition name="swap" mode="out-in">
                <img
                  v-if="selectedFrame"
                  :key="selectedFrame.url"
                  :src="selectedFrame.url"
                  :alt="`Pratinjau ${selectedFrame.name}`"
                  class="h-full w-full object-contain drop-shadow-[0_12px_24px_rgb(140_15_82_/_0.18)]"
                />
                <div v-else class="flex flex-col items-center gap-3 px-8 text-center text-ink-500">
                  <PhImagesSquare :size="32" class="text-brand-300" />
                  <p class="text-sm">Pilih frame untuk melihat pratinjau</p>
                </div>
              </Transition>
            </div>
          </div>

          <div v-if="selectedFrame" class="px-1">
            <p class="text-[17px] font-semibold">{{ selectedFrame.name }}</p>
            <p class="text-sm text-ink-500">{{ summary }}</p>
          </div>

          <label class="flex cursor-pointer items-start gap-3 rounded-[20px] bg-white p-4 shadow-soft">
            <input v-model="understand" type="checkbox" class="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-500" />
            <span class="text-sm leading-snug">
              <span class="block font-semibold text-ink-900">Saya mengerti, tidak ada foto ulang</span>
              <span class="mt-0.5 block text-ink-500">Simpan, cetak, atau email sebelum menutup halaman.</span>
            </span>
          </label>

          <button type="button" class="btn btn-primary w-full" :disabled="!canGo" @click="go">
            Buka kamera
            <PhArrowRight :size="20" weight="bold" />
          </button>
        </div>
      </aside>
    </div>

    <!-- Mobile CTA -->
    <div
      class="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-blush-50 from-60% to-blush-50/0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:hidden"
    >
      <p class="mb-3 text-center text-[13px] text-ink-500">{{ canGo ? summary : hint }}</p>
      <button type="button" class="btn btn-primary w-full" :disabled="!canGo" @click="go">
        Buka kamera
        <PhArrowRight :size="20" weight="bold" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { PhArrowRight, PhCheck, PhImagesSquare, PhWarningCircle } from "@phosphor-icons/vue";
import TopBar from "@/components/TopBar.vue";
import { loadFrames, type Frame } from "@/lib/frames";
import { FILTERS, isFilterMode, type FilterMode } from "@/lib/filters";

type LayoutPayload = {
  canvasW: number;
  canvasH: number;
  slots: { x: number; y: number; w: number; h: number }[];
  footer?: string;
};
type StoredSettings = {
  frameUrl: string;
  filter: FilterMode;
  timerSeconds: number;
  layout?: LayoutPayload;
};

const TIMERS = [1, 3, 5, 10];

const router = useRouter();
const frames = ref<Frame[]>([]);
const loading = ref(true);
const loadError = ref<string | null>(null);

const selectedFrameKey = ref("");
const filter = ref<FilterMode>("none");
const timerSeconds = ref<number>(3);
const understand = ref(false);

const selectedFrame = computed(() => frames.value.find((f) => f.id === selectedFrameKey.value));
const canGo = computed(() => understand.value && !!selectedFrame.value);

const hint = computed(() =>
  !selectedFrame.value ? "Pilih frame dulu" : "Centang persetujuan untuk lanjut"
);
const summary = computed(() => {
  const f = selectedFrame.value;
  if (!f) return "";
  const filterLabel = FILTERS.find((o) => o.value === filter.value)?.label ?? "Normal";
  return `${f.layout.slots.length} pose · ${filterLabel} · ${timerSeconds.value} detik`;
});

function readStoredSettings(): Partial<StoredSettings> {
  try {
    const raw = sessionStorage.getItem("selfsnap.settings");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      frameUrl: typeof parsed.frameUrl === "string" ? parsed.frameUrl : "",
      filter: isFilterMode(parsed.filter) ? parsed.filter : "none",
      timerSeconds: typeof parsed.timerSeconds === "number" ? parsed.timerSeconds : 3,
    };
  } catch {
    return {};
  }
}

async function init() {
  loading.value = true;
  const list = await loadFrames();
  frames.value = list.frames;
  loadError.value = list.error;

  // Restore the previously selected frame by URL match
  const stored = readStoredSettings();
  const match = stored.frameUrl ? frames.value.find((f) => f.url === stored.frameUrl) : undefined;
  if (match) selectedFrameKey.value = match.id;
  else if (frames.value.length === 1) selectedFrameKey.value = frames.value[0]!.id;

  loading.value = false;
}

function go() {
  if (!selectedFrame.value || !canGo.value) return;

  const payload: StoredSettings = {
    frameUrl: selectedFrame.value.url,
    filter: filter.value,
    timerSeconds: timerSeconds.value,
    layout: selectedFrame.value.layout,
  };

  sessionStorage.setItem("selfsnap.settings", JSON.stringify(payload));
  router.push("/booth");
}

onMounted(() => {
  const stored = readStoredSettings();
  if (stored.filter) filter.value = stored.filter;
  if (stored.timerSeconds) timerSeconds.value = stored.timerSeconds;

  init();
});
</script>
