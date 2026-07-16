<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-text">Configuration</h1>
      <p class="mt-1 text-sm text-text-muted">Parametres du site</p>
    </div>

    <div
      class="rounded-2xl border border-border bg-surface shadow-sm p-6 space-y-8"
    >
      <div v-for="group in configGroups" :key="group.title">
        <h2
          class="text-base font-semibold text-text mb-4 border-b border-border pb-2"
        >
          {{ group.title }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="field in group.fields" :key="field.key">
            <label class="block text-xs font-medium text-text-muted mb-1">{{
              field.label
            }}</label>
            <template v-if="field.type === 'multilingual'">
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
                    v-model="config[field.key][lang]"
                    :dir="lang === 'ar' ? 'rtl' : 'ltr'"
                    class="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition"
                  />
                </div>
              </div>
            </template>
            <template v-else-if="field.type === 'multilingual-textarea'">
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
                    v-model="config[field.key][lang]"
                    :dir="lang === 'ar' ? 'rtl' : 'ltr'"
                    class="flex-1 px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition"
                    rows="2"
                  ></textarea>
                </div>
              </div>
            </template>
            <template v-else-if="field.type === 'media'">
              <div class="space-y-3">
                <div class="flex items-center gap-3 flex-wrap">
                  <label
                    class="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 border border-border rounded-lg cursor-pointer transition-colors text-sm font-medium text-text"
                    :class="
                      isUploading(field.key)
                        ? 'opacity-60 pointer-events-none'
                        : ''
                    "
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Parcourir
                    <input
                      type="file"
                      @change="(e) => uploadMedia(field.key, e)"
                      accept="image/*,video/*"
                      class="hidden"
                      :disabled="isUploading(field.key)"
                    />
                  </label>

                  <span
                    v-if="
                      !isUploading(field.key) && isProcessing(config[field.key])
                    "
                    class="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium"
                  >
                    <Spinner size-class="h-3.5 w-3.5" />
                    Vidéo en cours de traitement…
                  </span>
                  <span
                    v-else-if="!isUploading(field.key) && config[field.key]"
                    class="text-xs text-success font-medium"
                    >✓ Fichier uploadé</span
                  >
                  <button
                    v-if="
                      !isUploading(field.key) && isProcessing(config[field.key])
                    "
                    type="button"
                    @click="retryProcessing"
                    class="text-xs text-primary underline"
                  >
                    Relancer
                  </button>
                  <button
                    v-if="!isUploading(field.key) && config[field.key]"
                    type="button"
                    @click="removeMedia(field.key)"
                    class="text-xs text-red-600 hover:text-red-700 underline"
                  >
                    Supprimer
                  </button>
                </div>

                <!-- Upload progress bar -->
                <div v-if="isUploading(field.key)" class="max-w-md">
                  <div class="flex items-center gap-2">
                    <div
                      class="flex-1 h-2 rounded-full bg-border overflow-hidden"
                    >
                      <div
                        class="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                        :style="{ width: getUploadProgress(field.key) + '%' }"
                      ></div>
                    </div>
                    <span
                      class="text-xs font-medium text-text-muted tabular-nums"
                      >{{ getUploadProgress(field.key) }}%</span
                    >
                  </div>
                </div>

                <!-- Media preview -->
                <video
                  v-else-if="config[field.key] && isVideoUrl(config[field.key])"
                  :src="config[field.key]"
                  class="w-full max-w-md rounded-lg border border-border aspect-video object-cover bg-black"
                  controls
                  muted
                  preload="metadata"
                  playsinline
                />
                <img
                  v-else-if="config[field.key]"
                  :src="config[field.key]"
                  class="w-full max-w-md rounded-lg border border-border aspect-video object-cover"
                />
              </div>
            </template>
            <template v-else-if="field.type === 'textarea'">
              <textarea
                v-model="config[field.key]"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition"
                rows="3"
              ></textarea>
            </template>
            <template v-else-if="field.type === 'boolean'">
              <button
                type="button"
                @click="
                  config[field.key] =
                    config[field.key] === 'true' ? 'false' : 'true'
                "
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="
                  config[field.key] === 'true' ? 'bg-primary' : 'bg-border'
                "
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="
                    config[field.key] === 'true'
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  "
                ></span>
              </button>
            </template>
            <template v-else>
              <input
                v-model="config[field.key]"
                :type="field.type || 'text'"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition"
              />
            </template>
          </div>
        </div>
      </div>

      <div class="flex justify-end pt-4 border-t border-border">
        <button
          @click="save"
          :disabled="saving"
          class="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
        >
          {{ saving ? "Enregistrement..." : "Enregistrer tout" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useApi } from "../composables/useApi";
import { useToast } from "../composables/useToast";
import Spinner from "../components/Spinner.vue";

const api = useApi();
const toast = useToast();
const saving = ref(false);
const loaded = ref(false);
const uploading = ref({});
const uploadProgress = ref({});

const MULTILINGUAL_KEYS = new Set([
  "name",
  "tagline",
  "description",
  "address",
  "hours",
  "seo_title",
  "seo_description",
  "popup_title",
  "popup_text",
]);

// Pre-seed multilingual keys so the template never reads `undefined[lang]`
// during the first (pre-fetch) render — that was crashing the whole page.
function emptyConfig() {
  const base = {};
  for (const key of MULTILINGUAL_KEYS) base[key] = { fr: "", en: "", ar: "" };
  return base;
}

const config = ref(emptyConfig());

const configGroups = [
  {
    title: "Informations générales",
    fields: [
      { key: "name", label: "Nom du site", type: "multilingual" },
      { key: "tagline", label: "Tagline", type: "multilingual" },
      {
        key: "description",
        label: "Description",
        type: "multilingual-textarea",
      },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "email", label: "Email" },
      { key: "phone", label: "Téléphone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "address", label: "Adresse", type: "multilingual" },
    ],
  },
  {
    title: "Réseaux sociaux",
    fields: [
      { key: "instagram", label: "Instagram" },
      { key: "facebook", label: "Facebook" },
      { key: "tiktok", label: "TikTok" },
    ],
  },
  {
    title: "Horaires & Localisation",
    fields: [
      { key: "hours", label: "Horaires", type: "multilingual" },
      { key: "lat", label: "Latitude" },
      { key: "lng", label: "Longitude" },
    ],
  },
  {
    title: "Médias",
    fields: [
      { key: "logo_url", label: "Logo", type: "media" },
      { key: "hero_video_url", label: "Vidéo Hero", type: "media" },
      { key: "hero_poster_url", label: "Poster Hero", type: "media" },
      { key: "about_image_1", label: "Image About 1", type: "media" },
      { key: "about_image_2", label: "Image About 2", type: "media" },
    ],
  },
  {
    title: "SEO & Référencement",
    fields: [
      {
        key: "seo_title",
        label: "Titre SEO (balise title)",
        type: "multilingual",
      },
      {
        key: "seo_description",
        label: "Meta description",
        type: "multilingual-textarea",
      },
      { key: "seo_keywords", label: "Mots-clés (séparés par des virgules)" },
      {
        key: "og_image",
        label: "Image de partage (Open Graph)",
        type: "media",
      },
    ],
  },
  {
    title: "Popup d'accueil",
    fields: [
      { key: "popup_enabled", label: "Activer le popup", type: "boolean" },
      { key: "popup_title", label: "Titre du popup", type: "multilingual" },
      {
        key: "popup_text",
        label: "Texte du popup",
        type: "multilingual-textarea",
      },
    ],
  },
];

onMounted(async () => {
  try {
    const data = await api.get("/config");
    const merged = emptyConfig();
    for (const [key, value] of Object.entries(data || {})) {
      if (MULTILINGUAL_KEYS.has(key)) {
        merged[key] =
          value && typeof value === "object"
            ? { fr: "", en: "", ar: "", ...value }
            : { fr: value || "", en: "", ar: "" };
      } else {
        merged[key] = value;
      }
    }
    if (!merged.popup_enabled) merged.popup_enabled = "false";
    config.value = merged;
  } catch (e) {
    toast.error(e.message || "Erreur lors du chargement de la configuration.");
  } finally {
    loaded.value = true;
  }
});

async function uploadMedia(key, e) {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  uploading.value[key] = true;
  uploadProgress.value[key] = 0;
  try {
    const { url } = await api.upload("/upload", fd, {
      onProgress: (p) => (uploadProgress.value[key] = p),
    });
    config.value[key] = url;
    // Persist immediately (matches ilot) so the backend promotion is triggered
    // and the processing badge/poll reflect the real saved state after refresh.
    await api.put(`/config/${key}`, { value: url });
    toast.success("Fichier téléversé.");
  } catch (err) {
    toast.error(err?.message || "Échec de l'envoi du fichier.");
  } finally {
    uploading.value[key] = false;
    delete uploadProgress.value[key];
    e.target.value = "";
  }
}

function isUploading(key) {
  return Boolean(uploading.value[key]);
}

function getUploadProgress(key) {
  return uploadProgress.value[key] ?? 0;
}

async function removeMedia(key) {
  try {
    config.value[key] = "";
    await api.put(`/config/${key}`, { value: "" });
    toast.success("Média supprimé.");
  } catch (err) {
    toast.error(err?.message || "Échec de la suppression.");
  }
}

const mediaKeys = configGroups.flatMap((g) =>
  g.fields.filter((f) => f.type === "media").map((f) => f.key),
);

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

// Silently refresh only the media keys while a video is processing so the
// badge clears itself without disturbing other fields the user is editing.
async function refreshProcessingSilently() {
  try {
    const fresh = await api.get("/config");
    for (const k of mediaKeys) {
      if (fresh[k] !== undefined && config.value[k] !== fresh[k]) {
        config.value[k] = fresh[k];
      }
    }
  } catch {
    /* ignore transient polling errors */
  }
}

let processingTimer = null;
let processingTicks = 0;
const MAX_PROCESSING_TICKS = 60; // ~5 min at 5s — never poll forever
function stopProcessingPoll() {
  if (processingTimer) {
    clearInterval(processingTimer);
    processingTimer = null;
  }
}
const hasProcessing = computed(() =>
  mediaKeys.some((k) => isProcessing(config.value[k])),
);
watch(hasProcessing, (active) => {
  if (active && !processingTimer) {
    processingTicks = 0;
    processingTimer = setInterval(() => {
      processingTicks += 1;
      if (processingTicks > MAX_PROCESSING_TICKS) {
        stopProcessingPoll();
        return;
      }
      refreshProcessingSilently();
    }, 5000);
  } else if (!active) {
    stopProcessingPoll();
  }
});
onUnmounted(stopProcessingPoll);

async function save() {
  const REQUIRED_MULTILINGUAL = [
    "name",
    "tagline",
    "description",
    "address",
    "hours",
  ];
  for (const key of REQUIRED_MULTILINGUAL) {
    const val = config.value[key];
    if (!val || !val.fr?.trim() || !val.en?.trim() || !val.ar?.trim()) {
      toast.error(
        `Le champ "${key}" doit être rempli en français, anglais et arabe.`,
      );
      return;
    }
  }
  saving.value = true;
  try {
    await api.put("/config", config.value);
    toast.success("Configuration enregistrée.");
  } catch (e) {
    toast.error(e.message || "Erreur lors de l'enregistrement.");
  } finally {
    saving.value = false;
  }
}
</script>
