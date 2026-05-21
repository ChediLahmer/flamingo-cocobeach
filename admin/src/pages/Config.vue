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
            <template v-if="field.type === 'media'">
              <div class="flex items-center gap-3">
                <label
                  class="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 border border-border rounded-lg cursor-pointer transition-colors text-sm font-medium text-text"
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
                  />
                </label>
                <img
                  v-if="
                    config[field.key] && !config[field.key].includes('video')
                  "
                  :src="config[field.key]"
                  class="w-12 h-12 rounded object-cover border"
                />
                <span
                  v-if="config[field.key]"
                  class="text-xs text-success font-medium"
                  >✓ Fichier uploade</span
                >
              </div>
            </template>
            <template v-else-if="field.type === 'textarea'">
              <textarea
                v-model="config[field.key]"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition"
                rows="3"
              ></textarea>
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
import { ref, onMounted } from "vue";
import { useApi } from "../composables/useApi";

const api = useApi();
const config = ref({});
const saving = ref(false);

const configGroups = [
  {
    title: "Informations générales",
    fields: [
      { key: "name", label: "Nom du site" },
      { key: "tagline", label: "Tagline" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "email", label: "Email" },
      { key: "phone", label: "Téléphone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "address", label: "Adresse" },
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
      { key: "hours", label: "Horaires" },
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
];

onMounted(async () => {
  config.value = await api.get("/config");
});

async function uploadMedia(key, e) {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  const { url } = await api.upload("/upload", fd);
  config.value[key] = url;
}

async function save() {
  saving.value = true;
  try {
    await api.put("/config", config.value);
  } finally {
    saving.value = false;
  }
}
</script>
