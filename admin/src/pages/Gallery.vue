<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useApi } from "../composables/useApi";

const ITEMS_PER_PAGE = 24;
const api = useApi();
const categories = ref([]);
const allImages = ref([]);
const selectedCat = ref(null);
const showUpload = ref(false);
const showCatForm = ref(false);
const uploadCatId = ref(null);
const uploading = ref(false);
const uploadProgress = ref("");
const uploadTotal = ref(0);
const uploadCurrent = ref(0);
const catForm = ref({ fr: "", en: "" });
const loading = ref(false);
const error = ref(null);
const page = ref(1);

const imageCount = computed(() => allImages.value.length);
const totalPages = computed(() =>
  Math.ceil(allImages.value.length / ITEMS_PER_PAGE),
);
const paginatedImages = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE;
  return allImages.value.slice(start, start + ITEMS_PER_PAGE);
});

async function loadCategories() {
  try {
    categories.value = await api.get("/gallery/categories");
  } catch (e) {
    error.value = e.message;
  }
}

async function loadImages() {
  loading.value = true;
  error.value = null;
  try {
    const params = selectedCat.value
      ? `?categoryId=${selectedCat.value}&limit=200`
      : "?limit=200";
    const res = await api.get(`/gallery${params}`);
    allImages.value = res.items || [];
    page.value = 1;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadCategories();
  await loadImages();
});

watch(selectedCat, () => loadImages());

async function onFiles(e) {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  uploading.value = true;
  uploadTotal.value = files.length;
  uploadCurrent.value = 0;
  for (let i = 0; i < files.length; i++) {
    uploadCurrent.value = i + 1;
    uploadProgress.value = `${i + 1}/${files.length}`;
    const fd = new FormData();
    fd.append("file", files[i]);
    if (uploadCatId.value) fd.append("categoryId", uploadCatId.value);
    try {
      await api.upload("/gallery", fd);
    } catch (e) {
      error.value = `Erreur upload fichier ${i + 1}: ${e.message}`;
    }
  }
  uploading.value = false;
  uploadProgress.value = "";
  await loadImages();
}

async function toggleVisibility(img) {
  try {
    await api.put(`/gallery/${img.id}`, { visible: !img.visible });
    await loadImages();
  } catch (e) {
    error.value = e.message;
  }
}

async function deleteImage(img) {
  if (!confirm("Supprimer cette image ?")) return;
  try {
    await api.del(`/gallery/${img.id}`);
    await loadImages();
  } catch (e) {
    error.value = e.message;
  }
}

async function saveCat() {
  if (!catForm.value.fr.trim()) return;
  try {
    await api.post("/gallery/categories", {
      name: { fr: catForm.value.fr, en: catForm.value.en },
    });
    showCatForm.value = false;
    catForm.value = { fr: "", en: "" };
    await loadCategories();
  } catch (e) {
    error.value = e.message;
  }
}

async function deleteCat(cat) {
  if (!confirm(`Supprimer la categorie "${cat.name.fr}" ?`)) return;
  try {
    await api.del(`/gallery/categories/${cat.id}`);
    await loadCategories();
    if (selectedCat.value === cat.id) selectedCat.value = null;
  } catch (e) {
    error.value = e.message;
  }
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
      <button @click="error = null" class="underline font-medium ml-4">
        Fermer
      </button>
    </div>

    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-text">Galerie</h1>
        <p class="mt-1 text-sm text-text-muted">Gerez vos photos et videos</p>
      </div>
      <div class="flex gap-3">
        <button
          @click="showCatForm = true"
          class="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text hover:bg-surface-alt transition-colors"
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
          Categorie
        </button>
        <button
          @click="showUpload = true"
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
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          Photos
        </button>
      </div>
    </div>

    <!-- Category filter tabs -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <button
        @click="selectedCat = null"
        class="px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-150 shrink-0"
        :class="
          !selectedCat
            ? 'bg-primary text-white border-primary shadow-sm'
            : 'bg-surface text-text-muted border-border hover:border-primary/40 hover:text-text'
        "
      >
        Toutes
      </button>
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="group flex items-center shrink-0"
      >
        <button
          @click="selectedCat = cat.id"
          class="px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-150"
          :class="
            selectedCat === cat.id
              ? 'bg-primary text-white border-primary shadow-sm'
              : 'bg-surface text-text-muted border-border hover:border-primary/40 hover:text-text'
          "
        >
          {{ cat.name.fr }}
        </button>
        <button
          @click="deleteCat(cat)"
          class="ml-1 p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/5 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Supprimer"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <span class="flex items-center text-sm text-text-muted ml-auto shrink-0">
        {{ imageCount }} image(s)
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
      ></div>
    </div>

    <!-- Images grid -->
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-if="!paginatedImages.length"
        class="col-span-full flex flex-col items-center justify-center py-12 text-text-muted"
      >
        <svg
          class="h-12 w-12 mb-3 opacity-30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5"
          />
        </svg>
        <p class="text-sm">Aucune image</p>
      </div>
      <div
        v-for="img in paginatedImages"
        :key="img.id"
        class="relative group rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
      >
        <img
          :src="img.url"
          :alt="img.alt || ''"
          class="w-full h-40 object-cover"
          loading="lazy"
        />
        <div
          class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
        >
          <button
            @click="toggleVisibility(img)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/90 text-text hover:bg-white transition-colors"
          >
            {{ img.visible ? "Masquer" : "Afficher" }}
          </button>
          <button
            @click="deleteImage(img)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/90 text-white hover:bg-danger transition-colors"
          >
            Supprimer
          </button>
        </div>
        <div
          v-if="!img.visible"
          class="absolute top-2 right-2 bg-danger text-white text-[0.65rem] px-2 py-0.5 rounded-full font-medium"
        >
          Masque
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1 && !loading"
      class="flex items-center justify-between mt-6 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <span class="text-sm text-text-muted">
        Page {{ page }} / {{ totalPages }}
      </span>
      <div class="flex gap-2">
        <button
          @click="page--"
          :disabled="page <= 1"
          class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
        >
          Precedent
        </button>
        <button
          @click="page++"
          :disabled="page >= totalPages"
          class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- Upload Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showUpload"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="!uploading && (showUpload = false)"
        >
          <div class="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold text-text mb-5">
              Ajouter des photos
            </h3>
            <div class="space-y-3">
              <select
                v-model="uploadCatId"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              >
                <option :value="null">Sans categorie</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name.fr }}
                </option>
              </select>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                @change="onFiles"
                :disabled="uploading"
                class="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-lg file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer disabled:opacity-50"
              />
              <!-- Progress -->
              <div v-if="uploading" class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-text-muted">Upload en cours...</span>
                  <span class="font-medium text-text">{{
                    uploadProgress
                  }}</span>
                </div>
                <div
                  class="w-full h-2 bg-surface-alt rounded-full overflow-hidden"
                >
                  <div
                    class="h-full bg-primary rounded-full transition-all duration-300"
                    :style="{
                      width:
                        uploadTotal > 0
                          ? `${(uploadCurrent / uploadTotal) * 100}%`
                          : '0%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="flex gap-3 justify-end mt-6">
              <button
                @click="showUpload = false"
                :disabled="uploading"
                class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt disabled:opacity-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Category Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCatForm"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showCatForm = false"
        >
          <div class="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold text-text mb-5">
              Nouvelle categorie
            </h3>
            <div class="space-y-3">
              <input
                v-model="catForm.fr"
                placeholder="Nom (FR) *"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
              <input
                v-model="catForm.en"
                placeholder="Name (EN)"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
            <div class="flex gap-3 justify-end mt-6">
              <button
                @click="showCatForm = false"
                class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt transition-colors"
              >
                Annuler
              </button>
              <button
                @click="saveCat"
                class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Creer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
