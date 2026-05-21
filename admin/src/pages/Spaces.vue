<script setup>
import { ref, computed, onMounted, watch } from "vue";
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
const capacityFilter = ref(0);
const priceMax = ref(0);
const showFilters = ref(false);
const sortField = ref("default");
const sortDir = ref("asc");
const activeFilterCount = computed(() => {
  let c = 0;
  if (statusFilter.value !== "all") c++;
  if (capacityFilter.value > 0) c++;
  if (priceMax.value > 0) c++;
  return c;
});

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
watch([statusFilter, capacityFilter, priceMax, sortField, sortDir], () => {
  page.value = 1;
  load();
});

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams({
      page: page.value,
      limit: ITEMS_PER_PAGE,
    });
    if (search.value.trim()) params.set("search", search.value.trim());
    if (statusFilter.value === "available") params.set("available", "true");
    else if (statusFilter.value === "unavailable")
      params.set("available", "false");
    if (capacityFilter.value > 0)
      params.set("capacityMin", capacityFilter.value);
    if (priceMax.value > 0) params.set("priceMax", priceMax.value);
    if (sortField.value !== "default") {
      params.set("sortBy", sortField.value);
      params.set("sortDir", sortDir.value);
    }

    const res = await api.get(`/spaces?${params}`);
    spaces.value = res.items || [];
    total.value = res.total || 0;
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

async function toggleVisible(space) {
  try {
    await api.put(`/spaces/${space.id}`, { visible: !space.visible });
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
        v-model="sortField"
        class="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-surface"
      >
        <option value="default">Trier: Défaut</option>
        <option value="name">Trier: Nom</option>
        <option value="price">Trier: Prix</option>
        <option value="capacity">Trier: Capacité</option>
      </select>
      <button
        v-if="sortField !== 'default'"
        @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
        class="inline-flex items-center justify-center w-9 h-9 border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary/40 transition-colors"
        :title="sortDir === 'asc' ? 'Croissant' : 'Décroissant'"
      >
        <svg
          class="h-4 w-4 transition-transform"
          :class="sortDir === 'desc' ? 'rotate-180' : ''"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4"
          />
        </svg>
      </button>
      <button
        @click="showFilters = true"
        class="relative inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:border-primary/40 hover:text-primary transition-colors"
        :class="
          activeFilterCount
            ? 'border-primary/40 text-primary'
            : 'text-text-muted'
        "
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
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
          />
        </svg>
        Filtres
        <span
          v-if="activeFilterCount"
          class="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-primary text-white text-[0.6rem] font-bold"
          >{{ activeFilterCount }}</span
        >
      </button>
      <span class="text-sm text-text-muted ml-auto">{{ total }} espace(s)</span>
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
            <div class="flex items-center gap-0.5">
              <button
                @click="toggleAvailable(space)"
                class="p-1.5 rounded-lg transition-colors"
                :class="
                  space.available
                    ? 'text-success hover:bg-success/10'
                    : 'text-gray-300 hover:bg-gray-100'
                "
                :title="space.available ? 'Disponible' : 'Indisponible'"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    v-if="space.available"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    v-else
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </button>
              <button
                @click="toggleVisible(space)"
                class="p-1.5 rounded-lg transition-colors"
                :class="
                  space.visible
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-gray-300 hover:bg-gray-100'
                "
                :title="space.visible ? 'Visible' : 'Masqué'"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    v-if="space.visible"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    v-if="space.visible"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    v-if="!space.visible"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              </button>
            </div>
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

    <!-- Filter Panel (slide-in) -->
    <Teleport to="body">
      <Transition name="slide-panel">
        <div
          v-if="showFilters"
          class="fixed inset-0 z-50 flex justify-end"
          @click.self="showFilters = false"
        >
          <div
            class="absolute inset-0 bg-black/30"
            @click="showFilters = false"
          ></div>
          <div
            class="relative w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col"
          >
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-border"
            >
              <h3 class="text-lg font-semibold text-text">Filtres</h3>
              <button
                @click="showFilters = false"
                class="p-1.5 rounded-lg text-text-muted hover:bg-surface-alt transition-colors"
              >
                <svg
                  class="h-5 w-5"
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
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <!-- Status -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2"
                  >Statut</label
                >
                <div class="flex flex-col gap-2">
                  <label
                    class="flex items-center gap-2.5 text-sm text-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="statusFilter"
                      value="all"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    Tous
                  </label>
                  <label
                    class="flex items-center gap-2.5 text-sm text-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="statusFilter"
                      value="available"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    Disponibles
                  </label>
                  <label
                    class="flex items-center gap-2.5 text-sm text-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="statusFilter"
                      value="unavailable"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    Indisponibles
                  </label>
                </div>
              </div>
              <!-- Capacity -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2"
                  >Capacité minimum</label
                >
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="capacityFilter"
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    class="flex-1 accent-primary"
                  />
                  <span class="text-sm font-medium text-text w-8 text-center">{{
                    capacityFilter || "—"
                  }}</span>
                </div>
              </div>
              <!-- Price -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2"
                  >Prix maximum (DT)</label
                >
                <input
                  v-model.number="priceMax"
                  type="number"
                  step="10"
                  min="0"
                  placeholder="Sans limite"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
            </div>
            <div
              class="px-6 py-4 border-t border-border flex gap-3 justify-between"
            >
              <button
                @click="
                  statusFilter = 'all';
                  capacityFilter = 0;
                  priceMax = 0;
                "
                class="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
              >
                Réinitialiser
              </button>
              <button
                @click="showFilters = false"
                class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit/Create Panel (slide-in) -->
    <Teleport to="body">
      <Transition name="slide-panel">
        <div
          v-if="showForm"
          class="fixed inset-0 z-50 flex justify-end"
          @click.self="showForm = false"
        >
          <div
            class="absolute inset-0 bg-black/30"
            @click="showForm = false"
          ></div>
          <div
            class="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col"
          >
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-border"
            >
              <h3 class="text-lg font-semibold text-text">
                {{ editing ? "Modifier l'" : "Nouvel " }}espace
              </h3>
              <button
                @click="showForm = false"
                class="p-1.5 rounded-lg text-text-muted hover:bg-surface-alt transition-colors"
              >
                <svg
                  class="h-5 w-5"
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
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Nom (FR) *</label
                  >
                  <input
                    v-model="form.nameFr"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Name (EN)</label
                  >
                  <input
                    v-model="form.nameEn"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Description (FR)</label
                >
                <textarea
                  v-model="form.descFr"
                  rows="3"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
                ></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Prix</label
                  >
                  <input
                    v-model.number="form.price"
                    type="number"
                    step="0.5"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Capacité</label
                  >
                  <input
                    v-model.number="form.capacity"
                    type="number"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Image</label
                >
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
            <div
              class="px-6 py-4 border-t border-border flex gap-3 justify-end"
            >
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
