<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useApi } from "../composables/useApi";
import { useToast } from "../composables/useToast";

const api = useApi();
const toast = useToast();

const sales = ref([]);
const loading = ref(false);
const error = ref(null);
const showForm = ref(false);
const editing = ref(null);
const saving = ref(false);

const imagePreview = ref(null);
const removeImage = ref(false);

function toLocalInput(date) {
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function blankForm() {
  const now = new Date();
  const inWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    titleFr: "",
    titleEn: "",
    titleAr: "",
    descFr: "",
    descEn: "",
    descAr: "",
    discountPercent: 10,
    originalPrice: 0,
    startsAt: toLocalInput(now),
    endsAt: toLocalInput(inWeek),
    image: null,
    visible: true,
    order: 0,
  };
}

const form = ref(blankForm());

async function load() {
  loading.value = true;
  error.value = null;
  try {
    sales.value = await api.get("/flash-sales");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov|m4v|mkv|avi)(\?|$)/i.test(url || "");
}
function isProcessing(url) {
  return typeof url === "string" && url.includes("/incoming/");
}
async function retryProcessing() {
  try {
    await api.post("/upload/process-incoming");
    toast.success("Traitement relancé. Cela peut prendre un instant.");
  } catch (e) {
    toast.error(e?.message || "Échec du relancement du traitement.");
  }
}
async function refreshProcessingSilently() {
  try {
    const fresh = await api.get("/flash-sales");
    const byId = new Map((fresh || []).map((s) => [s.id, s]));
    for (const s of sales.value) {
      const f = byId.get(s.id);
      if (f && f.image !== s.image) s.image = f.image;
    }
  } catch {
    /* ignore transient polling errors */
  }
}
let processingTimer = null;
const hasProcessing = computed(() =>
  sales.value.some((s) => isProcessing(s.image)),
);
watch(hasProcessing, (active) => {
  if (active && !processingTimer) {
    processingTimer = setInterval(refreshProcessingSilently, 5000);
  } else if (!active && processingTimer) {
    clearInterval(processingTimer);
    processingTimer = null;
  }
});
onUnmounted(() => {
  if (processingTimer) clearInterval(processingTimer);
});

function isExpired(sale) {
  return new Date(sale.endsAt).getTime() <= Date.now();
}

const stats = computed(() => ({
  total: sales.value.length,
  active: sales.value.filter((s) => s.visible && !isExpired(s)).length,
  expired: sales.value.filter((s) => isExpired(s)).length,
}));

function openForm(sale = null) {
  editing.value = sale;
  imagePreview.value = null;
  removeImage.value = false;
  if (sale) {
    form.value = {
      titleFr: sale.title.fr,
      titleEn: sale.title.en || "",
      titleAr: sale.title.ar || "",
      descFr: sale.description?.fr || "",
      descEn: sale.description?.en || "",
      descAr: sale.description?.ar || "",
      discountPercent: sale.discountPercent,
      originalPrice:
        sale.originalPrice != null ? Number(sale.originalPrice) : 0,
      startsAt: toLocalInput(sale.startsAt),
      endsAt: toLocalInput(sale.endsAt),
      image: null,
      visible: sale.visible,
      order: sale.order || 0,
    };
  } else {
    form.value = blankForm();
  }
  showForm.value = true;
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  form.value.image = file;
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
  imagePreview.value = URL.createObjectURL(file);
}

async function save() {
  if (
    !form.value.titleFr.trim() ||
    !form.value.titleEn.trim() ||
    !form.value.titleAr.trim()
  ) {
    toast.error("Le titre est requis en français, anglais et arabe.");
    return;
  }
  if (form.value.discountPercent < 0 || form.value.discountPercent > 100) {
    toast.error("La remise doit être entre 0 et 100%.");
    return;
  }
  if (new Date(form.value.endsAt) <= new Date(form.value.startsAt)) {
    toast.error("La date de fin doit être après la date de début.");
    return;
  }
  saving.value = true;
  try {
    let imageUrl = editing.value?.image || null;
    if (removeImage.value) {
      imageUrl = null;
    } else if (form.value.image) {
      const fd = new FormData();
      fd.append("file", form.value.image);
      const res = await api.upload("/upload", fd);
      imageUrl = res.url;
    }
    const data = {
      title: {
        fr: form.value.titleFr,
        en: form.value.titleEn,
        ar: form.value.titleAr,
      },
      description: {
        fr: form.value.descFr,
        en: form.value.descEn,
        ar: form.value.descAr,
      },
      discountPercent: Number(form.value.discountPercent),
      originalPrice: form.value.originalPrice
        ? Number(form.value.originalPrice)
        : null,
      startsAt: new Date(form.value.startsAt).toISOString(),
      endsAt: new Date(form.value.endsAt).toISOString(),
      image: imageUrl,
      visible: form.value.visible,
      order: Number(form.value.order) || 0,
    };
    if (editing.value) {
      await api.put(`/flash-sales/${editing.value.id}`, data);
      toast.success("Offre mise à jour.");
    } else {
      await api.post("/flash-sales", data);
      toast.success("Offre créée.");
    }
    showForm.value = false;
    await load();
  } catch (e) {
    toast.error(e.message);
  } finally {
    saving.value = false;
  }
}

async function remove(sale) {
  if (!confirm(`Supprimer l'offre "${sale.title.fr}" ?`)) return;
  try {
    await api.del(`/flash-sales/${sale.id}`);
    await load();
    toast.success("Offre supprimée.");
  } catch (e) {
    toast.error(e.message);
  }
}

async function toggleVisible(sale) {
  try {
    await api.put(`/flash-sales/${sale.id}`, { visible: !sale.visible });
    await load();
  } catch (e) {
    toast.error(e.message);
  }
}

function fmtDate(d) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div>
    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm flex items-center justify-between"
    >
      <span>{{ error }}</span>
      <button @click="load" class="underline font-medium ml-4">
        Réessayer
      </button>
    </div>

    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-text">Ventes Flash</h1>
        <p class="mt-1 text-sm text-text-muted">
          Offres à durée limitée affichées sur le site
        </p>
      </div>
      <button
        @click="openForm()"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors"
      >
        <svg
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Nouvelle offre
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p class="text-xs text-text-muted">Total</p>
        <p class="text-2xl font-bold text-text">{{ stats.total }}</p>
      </div>
      <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p class="text-xs text-text-muted">Actives</p>
        <p class="text-2xl font-bold text-success">{{ stats.active }}</p>
      </div>
      <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p class="text-xs text-text-muted">Expirées</p>
        <p class="text-2xl font-bold text-text-muted">{{ stats.expired }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
      ></div>
    </div>

    <!-- Empty -->
    <div
      v-else-if="sales.length === 0"
      class="rounded-2xl border border-dashed border-border bg-surface p-12 text-center"
    >
      <div class="text-4xl mb-3">⚡</div>
      <p class="text-text-muted">Aucune offre flash pour le moment.</p>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="sale in sales"
        :key="sale.id"
        class="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden hover:shadow-md transition-shadow"
        :class="{ 'opacity-60': !sale.visible || isExpired(sale) }"
      >
        <div class="relative">
          <video
            v-if="sale.image && isVideoUrl(sale.image)"
            :src="sale.image"
            class="w-full h-36 object-cover"
            muted
            playsinline
            preload="metadata"
          />
          <img
            v-else-if="sale.image"
            :src="sale.image"
            class="w-full h-36 object-cover"
            loading="lazy"
          />
          <div
            v-else
            class="w-full h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-4xl"
          >
            ⚡
          </div>
          <button
            v-if="isProcessing(sale.image)"
            type="button"
            @click="retryProcessing"
            class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-amber-500/90 text-white text-[10px] font-medium"
            title="Relancer le traitement"
          >
            ⏳ Traitement…
          </button>
          <span
            class="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-white shadow"
          >
            -{{ sale.discountPercent }}%
          </span>
          <span
            v-if="isExpired(sale)"
            class="absolute top-2 right-2 rounded-full bg-danger/90 px-2.5 py-1 text-xs font-medium text-white"
          >
            Expirée
          </span>
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-text truncate">{{ sale.title.fr }}</h3>
          <p class="text-xs text-text-muted mt-1 line-clamp-2 min-h-[2rem]">
            {{ sale.description?.fr || "—" }}
          </p>
          <div class="mt-3 flex items-center gap-2 text-xs text-text-muted">
            <svg
              class="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Fin : {{ fmtDate(sale.endsAt) }}</span>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <button
              @click="openForm(sale)"
              class="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:border-primary/40 hover:text-primary transition-colors"
            >
              Modifier
            </button>
            <button
              @click="toggleVisible(sale)"
              class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors"
              :class="
                sale.visible
                  ? 'text-success hover:bg-success/5'
                  : 'text-text-muted hover:bg-surface-alt'
              "
            >
              {{ sale.visible ? "Visible" : "Masquée" }}
            </button>
            <button
              @click="remove(sale)"
              class="rounded-lg border border-border px-2.5 py-1.5 text-danger hover:bg-danger/5 transition-colors"
              title="Supprimer"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Modal -->
    <div
      v-if="showForm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      @click.self="showForm = false"
    >
      <div
        class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-xl"
      >
        <div
          class="sticky top-0 flex items-center justify-between border-b border-border bg-surface px-6 py-4"
        >
          <h2 class="text-lg font-semibold text-text">
            {{ editing ? "Modifier l'offre" : "Nouvelle offre flash" }}
          </h2>
          <button
            @click="showForm = false"
            class="text-text-muted hover:text-text text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div class="p-6 space-y-5">
          <!-- Title -->
          <div>
            <label class="block text-xs font-medium text-text-muted mb-2"
              >Titre *</label
            >
            <div class="space-y-2">
              <div
                v-for="lang in ['fr', 'en', 'ar']"
                :key="lang"
                class="flex items-center gap-2"
              >
                <span
                  class="text-xs font-semibold uppercase text-text-muted w-6"
                  >{{ lang }}</span
                >
                <input
                  v-model="
                    form[`title${lang.charAt(0).toUpperCase() + lang.slice(1)}`]
                  "
                  :dir="lang === 'ar' ? 'rtl' : 'ltr'"
                  class="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-medium text-text-muted mb-2"
              >Description</label
            >
            <div class="space-y-2">
              <div
                v-for="lang in ['fr', 'en', 'ar']"
                :key="lang"
                class="flex gap-2"
              >
                <span
                  class="text-xs font-semibold uppercase text-text-muted w-6 pt-2"
                  >{{ lang }}</span
                >
                <textarea
                  v-model="
                    form[`desc${lang.charAt(0).toUpperCase() + lang.slice(1)}`]
                  "
                  :dir="lang === 'ar' ? 'rtl' : 'ltr'"
                  rows="2"
                  class="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1"
                >Remise (%)</label
              >
              <input
                v-model.number="form.discountPercent"
                type="number"
                min="0"
                max="100"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1"
                >Prix initial (DT)</label
              >
              <input
                v-model.number="form.originalPrice"
                type="number"
                min="0"
                step="0.5"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1"
                >Début</label
              >
              <input
                v-model="form.startsAt"
                type="datetime-local"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1"
                >Fin *</label
              >
              <input
                v-model="form.endsAt"
                type="datetime-local"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
          </div>

          <!-- Image -->
          <div>
            <label class="block text-xs font-medium text-text-muted mb-2"
              >Image</label
            >
            <div class="flex items-center gap-3">
              <label
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 border border-border rounded-lg cursor-pointer transition-colors text-sm font-medium text-text"
              >
                Parcourir
                <input
                  type="file"
                  @change="onFileChange"
                  accept="image/*,video/*"
                  class="hidden"
                />
              </label>
              <img
                v-if="imagePreview || (editing?.image && !removeImage)"
                :src="imagePreview || editing.image"
                class="w-12 h-12 rounded object-cover border"
              />
              <button
                v-if="editing?.image && !removeImage"
                @click="removeImage = true"
                type="button"
                class="text-xs text-danger hover:underline"
              >
                Retirer
              </button>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-text">
              <input v-model="form.visible" type="checkbox" class="rounded" />
              Visible sur le site
            </label>
            <div class="flex items-center gap-2 ml-auto">
              <label class="text-xs text-text-muted">Ordre</label>
              <input
                v-model.number="form.order"
                type="number"
                class="w-20 px-3 py-1.5 border border-border rounded-lg text-sm outline-none"
              />
            </div>
          </div>
        </div>

        <div
          class="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-surface px-6 py-4"
        >
          <button
            @click="showForm = false"
            class="px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
          >
            Annuler
          </button>
          <button
            @click="save"
            :disabled="saving"
            class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {{ saving ? "Enregistrement..." : "Enregistrer" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
