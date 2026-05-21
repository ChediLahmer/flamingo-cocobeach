<script setup>
import { ref, onMounted, watch } from "vue";
import { useApi } from "../composables/useApi";

const ITEMS_PER_PAGE = 9;
const api = useApi();
const spaces = ref([]);
const showForm = ref(false);
const editing = ref(null);
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const search = ref("");
const statusFilter = ref("all");

const form = ref({
  nameFr: "",
  nameEn: "",
  descFr: "",
  price: 0,
  capacity: 1,
  image: null,
  available: true,
  visible: true,
});
const imagePreview = ref(null);
const removeImage = ref(false);

let searchDebounce = null;
watch(search, () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
watch(statusFilter, () => {
  page.value = 1;
  load();
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get(
      `/spaces?page=${page.value}&limit=${ITEMS_PER_PAGE}`,
    );
    let items = res.items || [];
    if (search.value) {
      const s = search.value.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.fr?.toLowerCase().includes(s) ||
          i.name.en?.toLowerCase().includes(s),
      );
    }
    if (statusFilter.value === "available") {
      items = items.filter((i) => i.available);
    } else if (statusFilter.value === "unavailable") {
      items = items.filter((i) => !i.available);
    }
    spaces.value = items;
    total.value = res.total || items.length;
    totalPages.value = res.totalPages || 1;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function goToPage(p) {
  page.value = p;
  load();
}

onMounted(load);

function openForm(space = null) {
  editing.value = space;
  imagePreview.value = null;
  removeImage.value = false;
  if (space) {
    form.value = {
      nameFr: space.name.fr,
      nameEn: space.name.en || "",
      descFr: space.description?.fr || "",
      price: Number(space.price),
      capacity: space.capacity,
      image: null,
      available: space.available,
      visible: space.visible,
    };
  } else {
    form.value = {
      nameFr: "",
      nameEn: "",
      descFr: "",
      price: 0,
      capacity: 1,
      image: null,
      available: true,
      visible: true,
    };
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
  if (!form.value.nameFr.trim()) return;
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
      name: { fr: form.value.nameFr, en: form.value.nameEn },
      description: { fr: form.value.descFr },
      price: form.value.price,
      capacity: form.value.capacity,
      image: imageUrl,
      available: form.value.available,
      visible: form.value.visible,
    };
    if (editing.value) {
      await api.put(`/spaces/${editing.value.id}`, data);
    } else {
      await api.post("/spaces", data);
    }
    showForm.value = false;
    await load();
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function remove(space) {
  if (!confirm(`Supprimer "${space.name.fr}" ?`)) return;
  try {
    await api.del(`/spaces/${space.id}`);
    await load();
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleAvailable(space) {
  try {
    await api.put(`/spaces/${space.id}`, { available: !space.available });
    await load();
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
      <button @click="load" class="underline font-medium ml-4">
        Reessayer
      </button>
    </div>

    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-text">Espaces</h1>
        <p class="mt-1 text-sm text-text-muted">Gerez les espaces privatifs</p>
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
        Espace
      </button>
    </div>

    <!-- Toolbar -->
    <div
      class="flex flex-wrap items-center gap-3 mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <div class="relative flex-1 max-w-xs min-w-[140px]">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="search"
          placeholder="Rechercher..."
          class="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
      </div>
      <select
        v-model="statusFilter"
        class="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-surface"
      >
        <option value="all">Tous</option>
        <option value="available">Disponibles</option>
        <option value="unavailable">Indisponibles</option>
      </select>
      <span class="text-sm text-text-muted">{{ total }} espace(s)</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
      ></div>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="space in spaces"
        :key="space.id"
        class="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      >
        <img
          v-if="space.image"
          :src="space.image"
          class="w-full h-40 object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"
        >
          <svg
            class="h-10 w-10 text-primary/30"
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
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between">
            <h3 class="font-semibold text-text">{{ space.name.fr }}</h3>
            <button
              @click="toggleAvailable(space)"
              class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
              :class="space.available ? 'bg-success' : 'bg-gray-300'"
            >
              <span
                class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200"
                :class="space.available ? 'translate-x-4' : 'translate-x-0'"
              ></span>
            </button>
          </div>
          <p class="text-text-muted text-sm mt-1">
            {{ space.price }} DT &middot; {{ space.capacity }} pers.
          </p>
          <div class="flex gap-2 mt-3">
            <button
              @click="openForm(space)"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-muted hover:text-primary hover:border-primary/40 transition-colors"
            >
              Modifier
            </button>
            <button
              @click="remove(space)"
              class="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/40 transition-colors"
            >
              Supprimer
            </button>
          </div>
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
          @click="goToPage(page - 1)"
          :disabled="page <= 1"
          class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
        >
          Precedent
        </button>
        <button
          @click="goToPage(page + 1)"
          :disabled="page >= totalPages"
          class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
        >
          Suivant
        </button>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showForm"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showForm = false"
        >
          <div
            class="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <h3 class="text-lg font-semibold text-text mb-5">
              {{ editing ? "Modifier l'" : "Nouvel " }}espace
            </h3>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="form.nameFr"
                  placeholder="Nom (FR) *"
                  class="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
                <input
                  v-model="form.nameEn"
                  placeholder="Name (EN)"
                  class="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <textarea
                v-model="form.descFr"
                placeholder="Description (FR)"
                rows="3"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
              ></textarea>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-text-muted mb-1">Prix</label>
                  <input
                    v-model.number="form.price"
                    type="number"
                    step="0.5"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs text-text-muted mb-1"
                    >Capacite</label
                  >
                  <input
                    v-model.number="form.capacity"
                    type="number"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>
              <!-- Image -->
              <div>
                <label class="block text-xs text-text-muted mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  @change="onFileChange"
                  class="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-lg file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer"
                />
                <div
                  v-if="imagePreview || (editing?.image && !removeImage)"
                  class="mt-2 flex items-center gap-3"
                >
                  <img
                    :src="imagePreview || editing?.image"
                    class="w-16 h-16 rounded-lg object-cover"
                  />
                  <button
                    @click="
                      removeImage = true;
                      imagePreview = null;
                      form.image = null;
                    "
                    class="text-xs text-danger hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <!-- Toggles -->
              <div class="flex gap-6 pt-2">
                <label class="flex items-center gap-2 text-sm text-text">
                  <input
                    v-model="form.available"
                    type="checkbox"
                    class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Disponible
                </label>
                <label class="flex items-center gap-2 text-sm text-text">
                  <input
                    v-model="form.visible"
                    type="checkbox"
                    class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Visible
                </label>
              </div>
            </div>
            <div class="flex gap-3 justify-end mt-6">
              <button
                @click="showForm = false"
                class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt transition-colors"
              >
                Annuler
              </button>
              <button
                @click="save"
                :disabled="saving"
                class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {{ saving ? "..." : "Enregistrer" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
