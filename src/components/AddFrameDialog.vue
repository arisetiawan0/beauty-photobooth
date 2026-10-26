<template>
  <dialog
    ref="dialogEl"
    class="sheet-dialog m-auto w-[min(94vw,880px)] rounded-[28px] bg-white p-0 text-ink-900 shadow-lift backdrop:bg-ink-950/40 backdrop:backdrop-blur-sm"
    aria-labelledby="addframe-title"
    @close="emit('close')"
    @click="onDialogClick"
  >
    <div class="max-h-[86dvh] overflow-y-auto p-6 sm:p-7">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 id="addframe-title" class="text-2xl font-bold tracking-[-0.03em]">Tambah frame</h2>
          <p class="mt-1 text-[15px] leading-relaxed text-ink-500">
            Upload gambar frame, lalu tandai letak kotak foto. Tersimpan di perangkat ini.
          </p>
        </div>
        <button
          type="button"
          class="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-ink-500 transition-[background-color] duration-150 hover:bg-ink-900/5"
          aria-label="Tutup"
          @click="close"
        >
          <PhX :size="18" weight="bold" />
        </button>
      </div>

      <!-- Step 1: pick file -->
      <label
        v-if="!imgUrl"
        class="mt-6 flex cursor-pointer flex-col items-center gap-4 rounded-[22px] border-2 border-dashed border-brand-200 bg-gradient-to-b from-blush-50 to-brand-50 px-8 py-12 text-center transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-brand-400"
      >
        <span class="grid size-16 place-items-center rounded-full bg-white text-brand-500 shadow-lift">
          <PhUploadSimple :size="26" weight="bold" />
        </span>
        <span>
          <span class="block text-[17px] font-bold tracking-[-0.01em]">Pilih gambar frame</span>
          <span class="mt-1 block text-sm text-ink-500">Klik untuk upload — PNG atau JPG</span>
        </span>
        <span class="rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-brand-600 shadow-soft">
          Idealnya rasio 105 × 148,5 mm
        </span>
        <input type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" @change="onFile" />
      </label>

      <!-- Step 2: editor -->
      <div v-else class="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
        <div class="flex min-w-0 justify-center">
          <div
            ref="editorEl"
            class="relative select-none"
            :style="{ aspectRatio: `${imgW} / ${imgH}`, width: `min(100%, calc(56dvh * ${imgW / imgH}))` }"
          >
            <img :src="imgUrl" alt="Frame" class="absolute inset-0 h-full w-full rounded-[10px] object-fill shadow-soft" />
            <div
              v-for="(s, i) in slots"
              :key="i"
              class="group/slot absolute cursor-move touch-none rounded-[4px] border-2 border-brand-500 bg-brand-500/10 shadow-[0_0_0_1px_rgb(255_255_255_/_0.6)_inset] transition-[background-color] duration-150 hover:bg-brand-500/20"
              :style="slotStyle(s)"
              @pointerdown="onDragStart($event, i, 'move', s)"
              @pointermove="onPointerMove"
              @pointerup="onDragEnd"
              @pointercancel="onDragEnd"
            >
              <span
                class="pointer-events-none absolute -top-3 -left-2 grid size-6 place-items-center rounded-full bg-brand-500 text-[11px] font-bold text-white shadow-button"
              >{{ i + 1 }}</span>
              <span
                class="absolute -bottom-2 -right-2 size-5 cursor-nwse-resize rounded-full border-2 border-white bg-brand-500 shadow-soft transition-[transform] duration-150 group-hover/slot:scale-110"
                @pointerdown.stop="onDragStart($event, i, 'resize', s)"
              ></span>
            </div>
            <p
              v-if="!slots.length"
              class="pointer-events-none absolute inset-0 grid place-items-center text-center text-sm font-medium text-ink-500"
            >
              Klik "Kotak foto" untuk mulai
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div>
            <label for="frame-name" class="text-sm font-semibold">Nama frame</label>
            <input
              id="frame-name"
              v-model="name"
              type="text"
              maxlength="40"
              placeholder="Misal: Anniversary Pink"
              class="mt-1.5 h-12 w-full rounded-[16px] bg-blush-50 px-4 text-[15px] ring-1 ring-ink-900/10 transition-[box-shadow] duration-150 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div class="rounded-[20px] bg-gradient-to-b from-blush-50 to-brand-50 p-4 ring-1 ring-brand-100">
            <p class="flex items-center gap-2 text-[15px] font-bold">
              <span class="grid size-6 place-items-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                {{ slots.length }}
              </span>
              kotak foto
            </p>
            <p class="mt-2 text-[13px] leading-relaxed text-ink-500">
              Tarik kotak untuk memindahkan, tarik bulatan di pojok untuk mengubah ukuran. Urutan kotak = urutan pose.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn btn-secondary h-12 px-3 text-sm" @click="addSlot">
              <PhPlus :size="18" weight="bold" />
              Kotak foto
            </button>
            <button type="button" class="btn btn-ghost h-12 px-3 text-sm" :disabled="!slots.length" @click="slots.pop()">
              <PhTrash :size="18" weight="bold" />
              Hapus akhir
            </button>
          </div>

          <button type="button" class="btn btn-ghost h-11 text-sm" @click="resetImage">
            <PhArrowCounterClockwise :size="16" weight="bold" />
            Ganti gambar
          </button>

          <button type="button" class="btn btn-primary mt-auto w-full" :disabled="!slots.length || saving" @click="save">
            <PhCheck :size="18" weight="bold" />
            {{ saving ? "Menyimpan…" : "Simpan frame" }}
          </button>
          <p v-if="error" role="alert" class="text-[13px] font-medium text-brand-700">{{ error }}</p>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { PhArrowCounterClockwise, PhCheck, PhPlus, PhTrash, PhUploadSimple, PhX } from "@phosphor-icons/vue";
import { saveCustomFrame, type Frame } from "@/lib/frames";
import type { FrameLayout, Rect } from "@/lib/layout";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; saved: [frame: Frame] }>();

// Print quality cap: keeps the data URL small enough for localStorage
const MAX_DIM = 2000;

const dialogEl = ref<HTMLDialogElement | null>(null);
const editorEl = ref<HTMLDivElement | null>(null);

const imgUrl = ref("");
const imgW = ref(0);
const imgH = ref(0);
const name = ref("");
const slots = ref<Rect[]>([]);
const saving = ref(false);
const error = ref("");

type Drag = { i: number; mode: "move" | "resize"; px: number; py: number; orig: Rect };
let drag: Drag | null = null;

function slotStyle(s: Rect) {
  return {
    left: `${(s.x / imgW.value) * 100}%`,
    top: `${(s.y / imgH.value) * 100}%`,
    width: `${(s.w / imgW.value) * 100}%`,
    height: `${(s.h / imgH.value) * 100}%`,
  };
}

function resetImage() {
  imgUrl.value = "";
  imgW.value = 0;
  imgH.value = 0;
  slots.value = [];
  name.value = "";
  error.value = "";
}

function close() {
  dialogEl.value?.close();
}

function onDialogClick(e: MouseEvent) {
  if (e.target === dialogEl.value) close();
}

watch(
  () => props.open,
  (open) => {
    if (open && !dialogEl.value?.open) {
      resetImage();
      dialogEl.value?.showModal();
    } else if (!open && dialogEl.value?.open) {
      dialogEl.value.close();
    }
  }
);

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  error.value = "";

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Gagal membaca file"));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("File bukan gambar yang valid"));
      el.src = dataUrl;
    });

    // Downscale huge files so they fit in localStorage
    let url = dataUrl;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (Math.max(w, h) > MAX_DIM) {
      const scale = MAX_DIM / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      url = c.toDataURL("image/png");
    }

    resetImage();
    imgUrl.value = url;
    imgW.value = w;
    imgH.value = h;
    name.value = file.name.replace(/\.(png|jpe?g|webp)$/i, "").replace(/[-_]+/g, " ").trim().slice(0, 40);
    addSlot();
  } catch (err: any) {
    error.value = err?.message ?? "Gagal memuat gambar.";
  }
}

function addSlot() {
  if (!imgW.value) return;
  const w = Math.round(imgW.value * 0.6);
  const h = Math.round(imgH.value * 0.28);
  const x = Math.round((imgW.value - w) / 2);
  const y = slots.value.length
    ? Math.min(imgH.value - h, slots.value[slots.value.length - 1]!.y + h + Math.round(imgH.value * 0.04))
    : Math.round((imgH.value - h) / 2);
  slots.value.push({ x, y, w, h });
}

function onDragStart(e: PointerEvent, i: number, mode: "move" | "resize", s: Rect) {
  e.preventDefault();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  drag = { i, mode, px: e.clientX, py: e.clientY, orig: { ...s } };
}

function onPointerMove(e: PointerEvent) {
  if (!drag) return;
  const rect = editorEl.value?.getBoundingClientRect();
  if (!rect) return;
  const dx = (e.clientX - drag.px) * (imgW.value / rect.width);
  const dy = (e.clientY - drag.py) * (imgH.value / rect.height);
  const min = Math.max(24, Math.round(Math.min(imgW.value, imgH.value) * 0.05));
  const o = drag.orig;

  let next: Rect;
  if (drag.mode === "move") {
    next = {
      w: o.w,
      h: o.h,
      x: clamp(o.x + dx, 0, imgW.value - o.w),
      y: clamp(o.y + dy, 0, imgH.value - o.h),
    };
  } else {
    next = {
      x: o.x,
      y: o.y,
      w: clamp(o.w + dx, min, imgW.value - o.x),
      h: clamp(o.h + dy, min, imgH.value - o.y),
    };
  }
  slots.value[drag.i] = next;
}

function onDragEnd() {
  drag = null;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Math.round(v)));
}

function save() {
  error.value = "";
  saving.value = true;
  try {
    const layout: FrameLayout = {
      canvasW: imgW.value,
      canvasH: imgH.value,
      slots: slots.value.map((s) => ({ ...s })),
      footer: "none",
    };
    const frame: Frame = {
      id: `custom/${Date.now()}`,
      name: name.value.trim() || "Frame saya",
      url: imgUrl.value,
      layout,
    };
    saveCustomFrame(frame);
    emit("saved", frame);
    dialogEl.value?.close();
  } catch (err: any) {
    error.value = err?.message ?? "Gagal menyimpan frame.";
  } finally {
    saving.value = false;
  }
}
</script>
