<template>
  <div class="bg-ink-950 text-white">
    <div
      class="mx-auto flex h-[100dvh] min-h-[560px] w-full max-w-7xl flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-8 md:pt-5"
    >
      <TopBar back-to="/settings" :step="2" tone="dark" :disabled="isRunning">
        <template #right>
          <button
            type="button"
            class="icon-btn icon-btn-dark"
            :disabled="isRunning || !cameraReady"
            aria-label="Ganti kamera depan atau belakang"
            @click="flipCamera"
          >
            <PhCameraRotate :size="20" weight="bold" />
          </button>
        </template>
      </TopBar>

      <main class="flex min-h-0 flex-1 gap-6 py-4 md:py-6" style="container-type: size">
        <!-- Viewfinder: as large as the space allows, same crop as the saved photo -->
        <div class="relative min-w-0 flex-1" style="container-type: size">
          <div
            class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] bg-white/5 shadow-[0_30px_60px_-24px_rgb(0_0_0_/_0.7)] ring-1 ring-white/10"
            :style="{ width: `min(100cqw, calc(100cqh * ${slotRatio}))`, aspectRatio: `${slotRatio}` }"
          >
            <video
              ref="videoEl"
              autoplay
              playsinline
              muted
              class="absolute inset-0 h-full w-full object-cover"
              :style="{
                filter: previewCssFilter,
                WebkitFilter: previewCssFilter,
                transform: (facingMode === 'user' ? 'scaleX(-1) ' : '') + 'translateZ(0)',
              }"
            />

            <div v-if="!cameraReady && !errorMsg" class="skeleton-dark absolute inset-0 grid place-items-center">
              <span class="text-sm font-medium text-white/80">Menyiapkan kamera…</span>
            </div>

            <!-- Framing corners -->
            <div aria-hidden="true" class="pointer-events-none absolute inset-4 md:inset-6">
              <span class="absolute left-0 top-0 size-7 rounded-tl-[10px] border-l-2 border-t-2 border-white/70"></span>
              <span class="absolute right-0 top-0 size-7 rounded-tr-[10px] border-r-2 border-t-2 border-white/70"></span>
              <span class="absolute bottom-0 left-0 size-7 rounded-bl-[10px] border-b-2 border-l-2 border-white/70"></span>
              <span class="absolute bottom-0 right-0 size-7 rounded-br-[10px] border-b-2 border-r-2 border-white/70"></span>
            </div>

            <span
              class="absolute left-4 top-4 rounded-full bg-ink-950/55 px-3 py-1.5 text-[13px] font-semibold tabular-nums ring-1 ring-white/10 backdrop-blur-md md:left-6 md:top-6"
            >
              Pose {{ Math.min(currentShotIndex + 1, totalShots) }} / {{ totalShots }}
            </span>

            <span
              aria-hidden="true"
              class="absolute bottom-5 left-1/2 hidden max-w-[calc(100%-2rem)] -translate-x-1/2 truncate rounded-full bg-ink-950/55 px-4 py-2 text-sm font-medium text-white/85 ring-1 ring-white/10 backdrop-blur-md md:block"
            >
              {{ statusText }}
            </span>

            <!-- Countdown -->
            <div
              v-if="countdown > 0"
              class="pointer-events-none absolute inset-0 grid place-items-center bg-ink-950/20"
            >
              <span
                :key="countdown"
                class="text-[clamp(72px,26cqh,220px)] font-bold leading-none tabular-nums text-white drop-shadow-[0_6px_24px_rgb(0_0_0_/_0.4)] motion-safe:animate-pop"
              >
                {{ countdown }}
              </span>
            </div>

            <!-- Shutter flash -->
            <div
              v-if="flashKey"
              :key="flashKey"
              class="pointer-events-none absolute inset-0 bg-white motion-safe:animate-flash motion-reduce:hidden"
            ></div>
          </div>
        </div>

        <!-- Tablet/desktop side column: progress strip + shutter, so the viewfinder keeps the full height -->
        <aside
          class="hidden shrink-0 flex-col items-center justify-center gap-5 md:flex"
          :style="{ width: `max(96px, calc((100cqh - 9.5rem) * ${frameRatio}))` }"
        >
          <StripPreview
            class="w-full"
            :frame-url="settings.frameUrl"
            :layout="layout"
            :shots="shots"
            :active-index="activeSlotIndex"
          />
          <ShutterButton :disabled="!cameraReady || isRunning || !!errorMsg" :running="isRunning" @press="startSequence" />
          <span class="text-sm font-medium tabular-nums text-white/60">{{ shots.length }}/{{ totalShots }} foto</span>
        </aside>
      </main>

      <footer :class="{ 'md:hidden': !errorMsg }">
        <div v-if="errorMsg" role="alert" class="mx-auto w-full max-w-xl rounded-[22px] bg-white/[0.06] p-4 ring-1 ring-white/10">
          <div class="flex gap-3">
            <PhWarningCircle :size="22" class="mt-0.5 shrink-0 text-brand-300" />
            <div>
              <p class="font-semibold">Kamera belum bisa dipakai</p>
              <p class="mt-1 text-sm leading-relaxed text-white/65">{{ errorMsg }}</p>
            </div>
          </div>
          <button type="button" class="btn btn-secondary mt-4 h-12 w-full" @click="startCamera">
            <PhArrowCounterClockwise :size="18" weight="bold" />
            Coba lagi
          </button>
        </div>

        <template v-else>
          <p class="min-h-[1.5rem] text-center text-[15px] text-white/70" aria-live="polite">{{ statusText }}</p>

          <div class="mt-4 grid grid-cols-[1fr_auto_1fr] items-center">
            <!-- Phones: progress strip beside the shutter, like a camera roll thumbnail -->
            <div class="justify-self-start">
              <StripPreview
                compact
                class="h-[96px] w-auto md:hidden"
                :frame-url="settings.frameUrl"
                :layout="layout"
                :shots="shots"
                :active-index="activeSlotIndex"
              />
            </div>

            <ShutterButton :disabled="!cameraReady || isRunning" :running="isRunning" @press="startSequence" />

            <span class="justify-self-end text-sm font-medium tabular-nums text-white/60">
              {{ shots.length }}/{{ totalShots }} foto
            </span>
          </div>
        </template>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  PhArrowCounterClockwise,
  PhCameraRotate,
  PhWarningCircle,
} from "@phosphor-icons/vue";
import ShutterButton from "@/components/ShutterButton.vue";
import StripPreview from "@/components/StripPreview.vue";
import TopBar from "@/components/TopBar.vue";
import { resolveLayout } from "@/lib/layout";

type FilterMode = "none" | "bw" | "sepia";
type Settings = { frameUrl: string; filter: FilterMode; timerSeconds: number; layout?: unknown };

const router = useRouter();

const videoEl = ref<HTMLVideoElement | null>(null);
const streamRef = ref<MediaStream | null>(null);

const cameraReady = ref(false);
const isRunning = ref(false);
const countdown = ref(0);
const currentShotIndex = ref(0);
const shots = ref<string[]>([]);
const errorMsg = ref<string>("");

const facingMode = ref<"user" | "environment">("user");
const flashKey = ref(0);
const settings = reactive<Settings>(loadSettings());

// Layout resolved from settings (strip3 or grid4, from the frame's tag)
const layout = computed(() => resolveLayout(settings.layout));
const FRAME_W = computed(() => layout.value.canvasW);
const FRAME_H = computed(() => layout.value.canvasH);

const slotsPx = computed(() => layout.value.slots);

/**
 * Active slot for preview:
 * - if running: currentShotIndex
 * - if not running: show slot 0 (so user sees where they'll be framed)
 */
const activeSlotIndex = computed(() => (isRunning.value ? currentShotIndex.value : 0));

const activeSlot = computed(
  () => slotsPx.value[activeSlotIndex.value] ?? { x: 0, y: 0, w: 3, h: 4 }
);

// Viewfinder uses the slot's aspect ratio, so what you see is exactly what gets saved
const slotRatio = computed(() => activeSlot.value.w / activeSlot.value.h);
const frameRatio = computed(() => FRAME_W.value / FRAME_H.value);
const totalShots = computed(() => slotsPx.value.length);

const statusText = computed(() => {
  const total = slotsPx.value.length;
  if (!cameraReady.value) return "Menyiapkan kamera…";
  if (isRunning.value) {
    const n = currentShotIndex.value + 1;
    return countdown.value > 0 ? `Pose ${n} dari ${total}, siap-siap!` : `Pose ${n} dari ${total}`;
  }
  return `Atur posisi di kamera, lalu tekan tombol. ${total} foto otomatis.`;
});

const previewCssFilter = computed(() => {
  if (settings.filter === "bw") return "grayscale(1)";
  if (settings.filter === "sepia") return "sepia(1)";
  return "none";
});

function loadSettings(): Settings {
  try {
    const raw = sessionStorage.getItem("selfsnap.settings");
    if (raw) return { frameUrl: "", filter: "none", timerSeconds: 3, ...JSON.parse(raw) };
  } catch {}
  return { frameUrl: "", filter: "none", timerSeconds: 3 };
}

function saveShotsToSession(dataUrls: string[]) {
  sessionStorage.setItem("selfsnap.shots", JSON.stringify(dataUrls));
}

async function startCamera() {
  errorMsg.value = "";
  cameraReady.value = false;

  if (streamRef.value) {
    streamRef.value.getTracks().forEach((t) => t.stop());
    streamRef.value = null;
  }

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: facingMode.value,
        aspectRatio: { ideal: activeSlot.value.w / activeSlot.value.h },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    };

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn("First attempt failed, trying minimal constraints:", err);
      // Fallback to minimal constraints
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode.value },
        audio: false,
      });
    }

    streamRef.value = stream;
    if (!videoEl.value) throw new Error("Video element missing");
    videoEl.value.srcObject = stream;

    // Wait for video to be ready
    await new Promise<void>((resolve, reject) => {
      const v = videoEl.value!;
      const onReady = () => {
        v.removeEventListener("loadedmetadata", onReady);
        resolve();
      };
      const onError = () => {
        v.removeEventListener("error", onError);
        reject(new Error("Video failed to load"));
      };
      v.addEventListener("loadedmetadata", onReady);
      v.addEventListener("error", onError);
      
      setTimeout(() => {
        if (v.readyState >= 1) resolve();
      }, 3000);
    });

    cameraReady.value = true;
  } catch (err: any) {
    errorMsg.value =
      err?.name === "NotAllowedError"
        ? "Izin kamera ditolak. Izinkan akses kamera di pengaturan browser, lalu coba lagi."
        : `Gagal membuka kamera: ${err?.message ?? String(err)}`;
    console.error("Camera error:", err);
  }
}

async function flipCamera() {
  facingMode.value = facingMode.value === "user" ? "environment" : "user";
  await startCamera();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function canvasFilterString(mode: FilterMode) {
  if (mode === "bw") return "grayscale(1)";
  if (mode === "sepia") return "sepia(1)";
  return "none";
}

function drawVideoCoverToCanvas(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  outW: number,
  outH: number,
  filterMode: FilterMode
) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  const scale = Math.max(outW / vw, outH / vh);
  const dw = vw * scale;
  const dh = vh * scale;

  const dx = (outW - dw) / 2;
  const dy = (outH - dh) / 2;

  ctx.save();

  if (facingMode.value === "user") {
    ctx.translate(outW, 0);
    ctx.scale(-1, 1);
  }

  ctx.filter = canvasFilterString(filterMode);
  ctx.drawImage(video, dx, dy, dw, dh);

  ctx.restore();
}

async function captureOneShot(_: number): Promise<string> {
  const v = videoEl.value;
  if (!v) throw new Error("Video not ready");

  const slot = activeSlot.value;
  const scale = 1080 / Math.max(slot.w, slot.h);
  const outW = Math.round(slot.w * scale);
  const outH = Math.round(slot.h * scale);

  const shotCanvas = document.createElement("canvas");
  shotCanvas.width = outW;
  shotCanvas.height = outH;

  const ctx = shotCanvas.getContext("2d");
  if (!ctx) throw new Error("Shot canvas context missing");

  drawVideoCoverToCanvas(ctx, v, outW, outH, settings.filter);
  applyPixelFilter(ctx, settings.filter, outW, outH);

  return shotCanvas.toDataURL("image/jpeg", 0.92);
}

async function runCountdown(seconds: number) {
  countdown.value = seconds;
  while (countdown.value > 0) {
    await sleep(1000);
    countdown.value -= 1;
  }
}

async function startSequence() {
  if (!cameraReady.value || isRunning.value) return;

  isRunning.value = true;
  errorMsg.value = "";
  shots.value = [];
  currentShotIndex.value = 0;

  try {
    for (let i = 0; i < slotsPx.value.length; i++) {
      currentShotIndex.value = i;

      await runCountdown(settings.timerSeconds);
      const shot = await captureOneShot(i);
      shots.value = [...shots.value, shot];
      flashKey.value += 1;

      await sleep(250);
    }

    saveShotsToSession(shots.value);
    router.push("/result");
  } catch (err: any) {
    errorMsg.value = `Gagal memotret: ${err?.message ?? String(err)}`;
  } finally {
    countdown.value = 0;
    isRunning.value = false;
  }
}

onMounted(async () => {
  Object.assign(settings, loadSettings());
  await startCamera();
});

onBeforeUnmount(() => {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach((t) => t.stop());
    streamRef.value = null;
  }
});

function applyPixelFilter(ctx: CanvasRenderingContext2D, mode: FilterMode, w: number, h: number) {
  if (mode === "none") return;

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data; // Uint8ClampedArray

  if (mode === "bw") {
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;

      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      d[i] = y;
      d[i + 1] = y;
      d[i + 2] = y;
    }
  } else if (mode === "sepia") {
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] ?? 0;
      const g = d[i + 1] ?? 0;
      const b = d[i + 2] ?? 0;

      d[i]     = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
      d[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
      d[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    }
  }

  ctx.putImageData(img, 0, 0);
}
</script>