<template>
  <dialog
    ref="dialogEl"
    class="sheet-dialog m-auto w-[min(92vw,420px)] rounded-[28px] bg-white p-0 text-ink-900 shadow-lift backdrop:bg-ink-950/40 backdrop:backdrop-blur-sm"
    aria-labelledby="email-title"
    @close="emit('close')"
    @click="onDialogClick"
  >
    <div class="p-6 sm:p-7">
      <div class="flex items-start justify-between gap-4">
        <span class="grid size-12 place-items-center rounded-full bg-brand-50 text-brand-500">
          <PhCheckCircle v-if="sentTo" :size="24" weight="fill" />
          <PhEnvelopeSimple v-else :size="22" weight="bold" />
        </span>
        <button
          type="button"
          class="-mr-2 -mt-2 grid size-11 place-items-center rounded-full text-ink-500 transition-[background-color] duration-150 hover:bg-ink-900/5"
          aria-label="Tutup"
          @click="close"
        >
          <PhX :size="18" weight="bold" />
        </button>
      </div>

      <!-- Sent -->
      <div v-if="sentTo" class="mt-5">
        <h2 id="email-title" class="text-2xl font-bold tracking-[-0.03em]">Terkirim!</h2>
        <p class="mt-2 text-[15px] leading-relaxed text-ink-500">
          Link foto sudah dikirim ke <span class="font-semibold text-ink-900">{{ sentTo }}</span>. Cek inbox atau
          folder spam dalam beberapa menit.
        </p>
        <div class="mt-6 flex flex-col gap-2">
          <button type="button" class="btn btn-primary w-full" @click="close">Selesai</button>
          <button type="button" class="btn btn-ghost w-full" @click="reset">Kirim ke email lain</button>
        </div>
      </div>

      <!-- Form -->
      <form v-else class="mt-5" novalidate @submit.prevent="submit">
        <h2 id="email-title" class="text-2xl font-bold tracking-[-0.03em]">Kirim ke email</h2>
        <p class="mt-2 text-[15px] leading-relaxed text-ink-500">Kami kirim link untuk download fotomu.</p>

        <div class="mt-6 flex flex-col gap-2">
          <label for="email-input" class="text-sm font-semibold">Alamat email</label>
          <input
            id="email-input"
            ref="inputEl"
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            autocapitalize="off"
            spellcheck="false"
            placeholder="nama@email.com"
            class="h-14 rounded-[18px] bg-blush-50 px-4 text-base ring-1 ring-ink-900/10 transition-[box-shadow] duration-150 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
            :aria-invalid="!!error"
            aria-describedby="email-help email-error"
            :disabled="sending"
          />
          <p id="email-help" class="text-[13px] leading-relaxed text-ink-500">
            Foto akan diunggah ke server beauty supaya bisa dibuka lewat link.
          </p>
          <p v-if="error" id="email-error" role="alert" class="text-[13px] font-medium text-brand-700">{{ error }}</p>
        </div>

        <button type="submit" class="btn btn-primary mt-6 w-full" :disabled="sending">
          <PhPaperPlaneTilt :size="18" weight="bold" />
          {{ sending ? "Mengirim…" : "Kirim link foto" }}
        </button>
      </form>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { PhCheckCircle, PhEnvelopeSimple, PhPaperPlaneTilt, PhX } from "@phosphor-icons/vue";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const props = defineProps<{
  open: boolean;
  // JPEG data URL of the finished strip
  getImage: () => string | null;
}>();
const emit = defineEmits<{ close: []; sent: [url: string] }>();

const dialogEl = ref<HTMLDialogElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);
const email = ref("");
const error = ref("");
const sending = ref(false);
const sentTo = ref("");

function reset() {
  error.value = "";
  sentTo.value = "";
  nextTick(() => inputEl.value?.focus());
}

function close() {
  if (!sending.value) dialogEl.value?.close();
}

// Click on the backdrop (outside the content) closes
function onDialogClick(e: MouseEvent) {
  if (e.target === dialogEl.value) close();
}

watch(
  () => props.open,
  (open) => {
    if (open && !dialogEl.value?.open) {
      dialogEl.value?.showModal();
      reset();
    } else if (!open && dialogEl.value?.open) {
      dialogEl.value.close();
    }
  }
);

async function submit() {
  error.value = "";
  const address = email.value.trim();
  if (!EMAIL_RE.test(address)) {
    error.value = "Masukkan alamat email yang valid, misalnya nama@gmail.com.";
    return;
  }
  const image = props.getImage();
  if (!image) {
    error.value = "Foto belum siap. Tunggu sebentar lalu coba lagi.";
    return;
  }

  sending.value = true;
  try {
    const res = await fetch("/api/send-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address, image }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok) {
      throw new Error(
        data.error ?? (res.status === 404 ? "Fitur email belum aktif di server ini." : `Gagal mengirim (${res.status}).`)
      );
    }
    sentTo.value = address;
    emit("sent", data.url ?? "");
  } catch (e: any) {
    error.value = e?.message ?? "Gagal mengirim email. Coba lagi.";
  } finally {
    sending.value = false;
  }
}
</script>
