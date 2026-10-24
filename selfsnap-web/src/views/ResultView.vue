<template>
  <div class="mx-auto w-full max-w-6xl px-5 pb-36 pt-5 md:px-10 md:pb-16">
    <TopBar :step="3">
      <template #right>
        <button type="button" class="icon-btn" aria-label="Ke beranda" @click="again('/')">
          <PhHouse :size="20" weight="bold" />
        </button>
      </template>
    </TopBar>

    <!-- No photos in this session (opened directly or after closing the tab) -->
    <div v-if="!shots.length" class="mx-auto mt-20 flex max-w-sm flex-col items-center text-center motion-safe:animate-rise">
      <span class="grid size-16 place-items-center rounded-full bg-white text-brand-500 shadow-soft">
        <PhImagesSquare :size="28" />
      </span>
      <h1 class="mt-6 text-2xl font-bold tracking-[-0.03em]">Belum ada foto</h1>
      <p class="mt-2 text-ink-500">Foto hanya tersimpan selama halaman terbuka. Yuk mulai sesi baru.</p>
      <button type="button" class="btn btn-primary mt-8" @click="again('/settings')">
        Mulai foto
        <PhArrowRight :size="20" weight="bold" />
      </button>
    </div>

    <div
      v-else
      class="mt-8 flex flex-col items-center gap-10 md:mt-6 md:flex-row md:items-center md:justify-center md:gap-14 lg:gap-20"
    >
      <section class="shrink-0">
        <div class="rounded-[24px] bg-white p-2.5 shadow-lift motion-safe:animate-rise">
          <div class="relative" :class="canvasSize" :style="{ aspectRatio: `${layout.canvasW} / ${layout.canvasH}` }">
            <canvas
              ref="canvasEl"
              class="block h-full w-full rounded-[14px] img-outline"
              :class="{ invisible: !composedUrl }"
              aria-label="Photo strip kamu"
              role="img"
            ></canvas>
            <div v-if="!composedUrl && !errorMsg" class="skeleton absolute inset-0 rounded-[14px]"></div>
          </div>
        </div>
      </section>

      <section class="w-full max-w-[400px] motion-safe:animate-rise" style="animation-delay: 120ms">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1 text-[13px] font-semibold text-ink-900 short:hidden">
          <PhSparkle :size="14" weight="fill" />
          Sudah jadi
        </span>
        <h1 class="mt-4 text-[32px] font-bold leading-[1.05] tracking-[-0.035em] md:text-[40px] short:mt-0 short:text-[32px]">
          Cantik! Simpan fotomu sekarang
        </h1>
        <p class="mt-3 leading-relaxed text-ink-500">
          Simpan, cetak, atau kirim ke email sebelum menutup halaman. Setelah ditutup, foto tidak bisa dipulihkan.
        </p>

        <dl class="mt-6 grid grid-cols-3 gap-4 border-t border-ink-900/10 pt-5 text-sm short:mt-4 short:pt-4">
          <div>
            <dt class="text-ink-500">Tanggal</dt>
            <dd class="mt-0.5 font-semibold tabular-nums">{{ dateStr }}</dd>
          </div>
          <div>
            <dt class="text-ink-500">Pose</dt>
            <dd class="mt-0.5 font-semibold tabular-nums">{{ layout.slots.length }}</dd>
          </div>
          <div>
            <dt class="text-ink-500">Filter</dt>
            <dd class="mt-0.5 font-semibold">{{ filterLabel }}</dd>
          </div>
        </dl>

        <p v-if="errorMsg" role="alert" class="mt-5 flex items-start gap-2 text-sm text-brand-700">
          <PhWarningCircle :size="18" class="mt-px shrink-0" />
          {{ errorMsg }}
        </p>

        <!-- Desktop actions -->
        <div class="mt-7 hidden md:block short:mt-5">
          <button type="button" class="btn btn-primary w-full" :disabled="!composedUrl" @click="download">
            <span class="relative size-5">
              <PhDownloadSimple
                :size="20"
                weight="bold"
                class="absolute inset-0 transition-[opacity,transform,filter] duration-200 ease-out-soft"
                :class="saved ? 'scale-[0.25] opacity-0 blur-[4px]' : 'scale-100 opacity-100 blur-0'"
              />
              <PhCheck
                :size="20"
                weight="bold"
                class="absolute inset-0 transition-[opacity,transform,filter] duration-200 ease-out-soft"
                :class="saved ? 'scale-100 opacity-100 blur-0' : 'scale-[0.25] opacity-0 blur-[4px]'"
              />
            </span>
            {{ saved ? "Tersimpan" : "Simpan foto" }}
          </button>

          <div class="mt-3 grid gap-3" :class="canShare ? 'grid-cols-3' : 'grid-cols-2'">
            <button type="button" class="btn btn-secondary h-[76px] flex-col gap-1.5 rounded-[20px] px-2 text-[13px] short:h-[64px]" :disabled="!composedUrl || printing" @click="print">
              <PhPrinter :size="22" />
              {{ printing ? "Menyiapkan…" : "Cetak" }}
            </button>
            <button type="button" class="btn btn-secondary h-[76px] flex-col gap-1.5 rounded-[20px] px-2 text-[13px] short:h-[64px]" :disabled="!composedUrl" @click="emailOpen = true">
              <PhEnvelopeSimple :size="22" />
              Email
            </button>
            <button
              v-if="canShare"
              type="button"
              class="btn btn-secondary h-[76px] flex-col gap-1.5 rounded-[20px] px-2 text-[13px] short:h-[64px]"
              :disabled="!composedUrl || isSharing"
              @click="share"
            >
              <PhShareNetwork :size="22" />
              Bagikan
            </button>
          </div>

          <button type="button" class="btn btn-ghost mt-3 h-12 w-full text-ink-500 short:mt-1" @click="again('/booth')">
            <PhArrowCounterClockwise :size="18" weight="bold" />
            Foto lagi dengan frame yang sama
          </button>
        </div>

        <!-- Phone: secondary actions inline (primary ones live in the bottom bar) -->
        <div class="mt-6 flex gap-3 md:hidden">
          <button
            v-if="canShare"
            type="button"
            class="btn btn-secondary h-12 flex-1 px-4"
            :disabled="!composedUrl || isSharing"
            @click="share"
          >
            <PhShareNetwork :size="18" weight="bold" />
            Bagikan
          </button>
          <button type="button" class="btn btn-secondary h-12 flex-1 px-4" @click="again('/booth')">
            <PhArrowCounterClockwise :size="18" weight="bold" />
            Foto lagi
          </button>
        </div>
      </section>
    </div>

    <!-- Phone bottom bar -->
    <div
      v-if="shots.length"
      class="fixed inset-x-0 bottom-0 z-20 flex gap-3 bg-gradient-to-t from-blush-50 from-60% to-blush-50/0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8 md:hidden"
    >
      <button type="button" class="btn btn-primary flex-1 px-5" :disabled="!composedUrl" @click="download">
        <PhCheck v-if="saved" :size="20" weight="bold" />
        <PhDownloadSimple v-else :size="20" weight="bold" />
        {{ saved ? "Tersimpan" : "Simpan" }}
      </button>
      <button type="button" class="btn btn-secondary w-14 shrink-0 px-0" :disabled="!composedUrl" aria-label="Kirim ke email" @click="emailOpen = true">
        <PhEnvelopeSimple :size="20" weight="bold" />
      </button>
      <button type="button" class="btn btn-secondary w-14 shrink-0 px-0" :disabled="!composedUrl || printing" aria-label="Cetak" @click="print">
        <PhPrinter :size="20" weight="bold" />
      </button>
    </div>

    <EmailDialog :open="emailOpen" :get-image="jpegDataUrl" @close="emailOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  PhArrowCounterClockwise,
  PhArrowRight,
  PhCheck,
  PhDownloadSimple,
  PhEnvelopeSimple,
  PhHouse,
  PhImagesSquare,
  PhPrinter,
  PhShareNetwork,
  PhSparkle,
  PhWarningCircle,
} from "@phosphor-icons/vue";
import EmailDialog from "@/components/EmailDialog.vue";
import TopBar from "@/components/TopBar.vue";
import { resolveLayout } from "@/lib/layout";
import { printImage } from "@/lib/print";
import { pickTextColorFromRegion } from "@/lib/canvasColor";

type FilterMode = "none" | "bw" | "sepia";
type Settings = {
  frameUrl: string;
  filter: FilterMode;
  timerSeconds: number;
  layout?: unknown;
};

const router = useRouter();

const canvasEl = ref<HTMLCanvasElement | null>(null);
const composedUrl = ref<string>("");
const errorMsg = ref<string>("");

const shots = ref<string[]>(loadShots());
const settings = reactive<Settings>(loadSettings());

const layout = computed(() => resolveLayout(settings.layout));

const BRAND = "beauty photobooth";
const FILE_PREFIX = "beauty-photobooth";

const dateStr = computed(() => formatDate(new Date()));

const isSharing = ref(false);
const saved = ref(false);
const printing = ref(false);
const emailOpen = ref(false);
let savedTimer: ReturnType<typeof setTimeout> | undefined;

const filterLabel = computed(
  () => ({ none: "Normal", bw: "Mono", sepia: "Sepia" })[settings.filter] ?? "Normal"
);

// Tall strips fit the viewport height; wider grids fit a fixed width
const canvasSize = computed(() =>
  layout.value.canvasW / layout.value.canvasH < 0.5
    ? "h-[min(58dvh,640px)] md:h-[min(calc(100dvh_-_10rem),720px)]"
    : "w-[min(78vw,380px)]"
);

function loadSettings(): Settings {
  try {
    const raw = sessionStorage.getItem("selfsnap.settings");
    if (raw) return { frameUrl: "", filter: "none", timerSeconds: 3, ...JSON.parse(raw) };
  } catch {}
  return { frameUrl: "", filter: "none", timerSeconds: 3 };
}

function loadShots(): string[] {
  try {
    const raw = sessionStorage.getItem("selfsnap.shots");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((x) => typeof x === "string");
    }
  } catch {}
  return [];
}

// DD-MM-YYYY (Indonesian order)
function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

function canvasFilterString(mode: FilterMode) {
  if (mode === "bw") return "grayscale(1)";
  if (mode === "sepia") return "sepia(1)";
  return "none";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    (img as any).decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  filter: FilterMode
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;

  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;

  ctx.save();
  ctx.filter = canvasFilterString(filter);
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

async function compose() {
  errorMsg.value = "";
  composedUrl.value = "";

  const expected = layout.value.slots.length;
  if (shots.value.length !== expected) {
    errorMsg.value = `Jumlah foto tidak sesuai frame (${shots.value.length} dari ${expected}). Silakan foto ulang.`;
    return;
  }

  const canvas = canvasEl.value;
  if (!canvas) return;

  const W = layout.value.canvasW;
  const H = layout.value.canvasH;

  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    errorMsg.value = "Browser ini tidak bisa menyusun foto.";
    return;
  }

  // Brand font for the printed footer (falls back to system font if it fails to load)
  try {
    await document.fonts.load("700 96px Outfit");
  } catch {}

  // background
  if (settings.frameUrl) {
    const frameImg = await loadImage(settings.frameUrl);
    ctx.drawImage(frameImg, 0, 0, W, H);
  } else {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
  }

  // slots (must match frame layout)
  const slots = layout.value.slots;

  // draw shots (one per slot: 3 for strips, 4 for grids)
  for (let i = 0; i < slots.length; i++) {
    const shotSrc = shots.value[i];
    const slot = slots[i];
    if (!shotSrc || !slot) throw new Error("Missing shot or slot");

    const shotImg = await loadImage(shotSrc);

    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
    ctx.clip();

    drawCover(ctx, shotImg, slot.x, slot.y, slot.w, slot.h, settings.filter);
    ctx.restore();
  }

  const footerMode = layout.value.footer ?? "default";

  if (footerMode !== "none") {
    const compact = footerMode === "compact";

    const sampleX = compact ? Math.floor(W * 0.2) : Math.floor(W * 0.15);
    const sampleW = compact ? Math.floor(W * 0.6) : Math.floor(W * 0.7);
    const sampleY = compact ? H - 150 : H - 320;
    const sampleH = compact ? 130 : 240;

    const footerTextColor = pickTextColorFromRegion(ctx, sampleX, sampleY, sampleW, sampleH);

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = footerTextColor;

    if (compact) {
      // Strip frames: small date line in the narrow bottom margin
      ctx.font = "600 52px Outfit, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(dateStr.value, W / 2, H - 52);
    } else {
      ctx.font = "700 96px Outfit, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(BRAND, W / 2, H - 220);

      ctx.font = "500 54px Outfit, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(dateStr.value, W / 2, H - 150);
    }

    ctx.restore();
  }

  composedUrl.value = canvas.toDataURL("image/png");
}

async function download() {
  const canvas = canvasEl.value;
  if (!canvas) return;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${FILE_PREFIX}-${dateStr.value}.png`;
    a.click();
    URL.revokeObjectURL(url);

    saved.value = true;
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => (saved.value = false), 2400);
  }, "image/png");
}

// JPEG keeps the email upload small (PNG strips can be several MB)
function jpegDataUrl(): string | null {
  return composedUrl.value ? (canvasEl.value?.toDataURL("image/jpeg", 0.9) ?? null) : null;
}

async function print() {
  const canvas = canvasEl.value;
  if (!canvas || printing.value) return;
  printing.value = true;
  try {
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal menyiapkan foto"))), "image/png")
    );
    await printImage(blob, layout.value);
  } catch (err: any) {
    errorMsg.value = `Gagal mencetak: ${err?.message ?? String(err)}`;
  } finally {
    printing.value = false;
  }
}

const canShare = computed(() => {
  const nav: any = navigator;
  return typeof nav !== "undefined" && typeof nav.share === "function";
});

async function share() {
  const canvas = canvasEl.value;
  if (!canvas) return;

  try {
    isSharing.value = true;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to create image blob"))),
        "image/png"
      );
    });

    const fileName = `${FILE_PREFIX}-${dateStr.value}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    const nav: any = navigator;

    if (typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
      await nav.share({
        files: [file],
        title: BRAND,
        text: `${BRAND} ${dateStr.value}`,
      });
      return;
    }

    // If file sharing isn't supported, fallback to download
    await download();
  } catch (err: any) {
    if (err?.name === "AbortError") return;

    await download();
  } finally {
    isSharing.value = false;
  }
}

// Leave the result: photos are dropped, settings stay for the next session
function again(path: "/" | "/booth" | "/settings") {
  sessionStorage.removeItem("selfsnap.shots");
  router.push(path);
}

onMounted(async () => {
  if (!shots.value.length) return;
  try {
    await compose();
  } catch (err: any) {
    errorMsg.value = err?.message ?? String(err);
  }
});
</script>