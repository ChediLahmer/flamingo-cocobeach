<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { useApi } from "../composables/useApi";
import { useToast } from "../composables/useToast";

const ITEMS_PER_PAGE = 10;
const api = useApi();
const toast = useToast();

const categories = ref([]);
const activeCategory = ref(null);
const loading = ref(false);
const error = ref(null);
const saving = ref(false);
const uploading = ref(false);
const uploadPct = ref(0);

const items = ref([]);
const itemTotal = ref(0);
const itemTotalPages = ref(1);
const itemSearch = ref("");
const itemSort = ref("order");
const itemSortDir = ref("asc");
const itemPage = ref(1);
const showFilters = ref(false);
const filterAvailable = ref("all");
const filterVisible = ref("all");

const activeFilterCount = computed(() => {
  let c = 0;
  if (filterAvailable.value !== "all") c++;
  if (filterVisible.value !== "all") c++;
  return c;
});

const showCatModal = ref(false);
const editingCat = ref(null);
const catForm = ref({ fr: "", en: "", ar: "", order: 0 });

const showItemModal = ref(false);
const editingItem = ref(null);
const itemForm = ref({
  nameFr: "",
  nameEn: "",
  nameAr: "",
  descFr: "",
  descEn: "",
  descAr: "",
  priceStandard: 0,
  priceExtra: 0,
  image: null,
  available: true,
  visible: true,
  order: 0,
});
const imagePreview = ref(null);
const removeImage = ref(false);

let debounceTimer = null;

async function loadCategories() {
  try {
    const data = await api.get("/menu/categories");
    categories.value = Array.isArray(data) ? data : [];
    if (!activeCategory.value && categories.value.length) {
      activeCategory.value = categories.value[0].id;
    }
  } catch (e) {
    error.value = e.message || "Erreur de chargement";
  }
}

async function loadItems() {
  if (!activeCategory.value) {
    items.value = [];
    itemTotal.value = 0;
    itemTotalPages.value = 1;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const params = new URLSearchParams({
      categoryId: activeCategory.value,
      page: itemPage.value,
      limit: ITEMS_PER_PAGE,
      sortBy: itemSort.value === "price" ? "priceStandard" : itemSort.value,
      sortDir: itemSortDir.value,
    });
    if (itemSearch.value.trim()) params.set("search", itemSearch.value.trim());
    if (filterAvailable.value === "yes") params.set("available", "true");
    else if (filterAvailable.value === "no") params.set("available", "false");
    if (filterVisible.value === "yes") params.set("visible", "true");
    else if (filterVisible.value === "no") params.set("visible", "false");

    const res = await api.get(`/menu/items?${params}`);
    items.value = res.items || [];
    itemTotal.value = res.total || 0;
    itemTotalPages.value = res.totalPages || 1;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  await loadCategories();
  await loadItems();
  loading.value = false;
}

onMounted(loadData);

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
    if (!activeCategory.value) return;
    const res = await api.get(
      `/menu/items?categoryId=${activeCategory.value}&limit=100`,
    );
    const byId = new Map((res.items || []).map((it) => [it.id, it]));
    for (const it of items.value) {
      const f = byId.get(it.id);
      if (f && f.image !== it.image) it.image = f.image;
    }
  } catch {
    /* ignore transient polling errors */
  }
}
let processingTimer = null;
const hasItemProcessing = computed(() =>
  items.value.some((it) => isProcessing(it.image)),
);
watch(hasItemProcessing, (active) => {
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

watch([itemSort, itemSortDir, filterAvailable, filterVisible], () => {
  itemPage.value = 1;
  loadItems();
});
watch(activeCategory, () => {
  itemPage.value = 1;
  loadItems();
});
watch(itemPage, () => loadItems());
watch(
  () => itemSearch.value,
  () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      itemPage.value = 1;
      loadItems();
    }, 300);
  },
);

function openCatModal(cat = null) {
  editingCat.value = cat;
  catForm.value = cat
    ? {
        fr: cat.name.fr,
        en: cat.name.en || "",
        ar: cat.name.ar || "",
        order: cat.order,
      }
    : { fr: "", en: "", ar: "", order: categories.value.length };
  showCatModal.value = true;
}

async function saveCat() {
  if (
    !catForm.value.fr.trim() ||
    !catForm.value.en.trim() ||
    !catForm.value.ar.trim()
  ) {
    toast.error("Les noms en français, anglais et arabe sont requis.");
    return;
  }
  saving.value = true;
  try {
    const data = {
      name: {
        fr: catForm.value.fr,
        en: catForm.value.en,
        ar: catForm.value.ar,
      },
      order: catForm.value.order,
    };
    if (editingCat.value) {
      await api.put(`/menu/categories/${editingCat.value.id}`, data);
      toast.success("Catégorie mise à jour.");
    } else {
      await api.post("/menu/categories", data);
      toast.success("Catégorie créée.");
    }
    showCatModal.value = false;
    await loadData();
  } catch (e) {
    toast.error(e.message);
  } finally {
    saving.value = false;
  }
}

async function deleteCat(cat) {
  if (!confirm(`Supprimer "${cat.name.fr}" et tous ses articles ?`)) return;
  try {
    await api.del(`/menu/categories/${cat.id}`);
    if (activeCategory.value === cat.id) activeCategory.value = null;
    await loadData();
    toast.success("Catégorie supprimée.");
  } catch (e) {
    toast.error(e.message);
  }
}

function openItemModal(item = null) {
  if (!activeCategory.value) return;
  editingItem.value = item;
  imagePreview.value = null;
  removeImage.value = false;
  itemForm.value = item
    ? {
        nameFr: item.name.fr,
        nameEn: item.name.en || "",
        nameAr: item.name.ar || "",
        descFr: item.description?.fr || "",
        descEn: item.description?.en || "",
        descAr: item.description?.ar || "",
        priceStandard: Number(item.priceStandard),
        priceExtra: Number(item.priceExtra),
        image: null,
        available: item.available,
        visible: item.visible,
        order: item.order,
      }
    : {
        nameFr: "",
        nameEn: "",
        nameAr: "",
        descFr: "",
        descEn: "",
        descAr: "",
        priceStandard: 0,
        priceExtra: 0,
        image: null,
        available: true,
        visible: true,
        order: items.value.length,
      };
  showItemModal.value = true;
}

async function saveItem() {
  if (
    !itemForm.value.nameFr.trim() ||
    !itemForm.value.nameEn.trim() ||
    !itemForm.value.nameAr.trim()
  ) {
    toast.error("Les noms en français, anglais et arabe sont requis.");
    return;
  }
  if (itemForm.value.priceStandard <= 0) {
    toast.error("Le prix standard doit être supérieur à 0.");
    return;
  }
  saving.value = true;
  try {
    let imageUrl = editingItem.value?.image || null;
    if (removeImage.value) {
      imageUrl = null;
    } else if (itemForm.value.image) {
      const fd = new FormData();
      fd.append("file", itemForm.value.image);
      uploading.value = true;
      uploadPct.value = 0;
      let res;
      try {
        res = await api.upload("/upload", fd, {
          onProgress: (p) => (uploadPct.value = p),
        });
      } finally {
        uploading.value = false;
      }
      imageUrl = res.url;
    }
    const payload = {
      name: {
        fr: itemForm.value.nameFr,
        en: itemForm.value.nameEn,
        ar: itemForm.value.nameAr,
      },
      description: {
        fr: itemForm.value.descFr,
        en: itemForm.value.descEn,
        ar: itemForm.value.descAr,
      },
      priceStandard: Number(itemForm.value.priceStandard),
      priceExtra: Number(itemForm.value.priceExtra),
      available: itemForm.value.available,
      visible: itemForm.value.visible,
      order: itemForm.value.order,
      categoryId: activeCategory.value,
      image: imageUrl,
    };
    if (editingItem.value) {
      await api.put(`/menu/items/${editingItem.value.id}`, payload);
      toast.success("Article mis à jour.");
    } else {
      await api.post("/menu/items", payload);
      toast.success("Article créé.");
    }
    showItemModal.value = false;
    await loadItems();
  } catch (e) {
    toast.error(e.message);
  } finally {
    saving.value = false;
  }
}

async function deleteItem(item) {
  if (!confirm(`Supprimer "${item.name.fr}" ?`)) return;
  try {
    await api.del(`/menu/items/${item.id}`);
    await loadItems();
    toast.success("Article supprimé.");
  } catch (e) {
    toast.error(e.message);
  }
}

async function toggleAvailability(item) {
  try {
    await api.put(`/menu/items/${item.id}`, { available: !item.available });
    await loadItems();
  } catch (e) {
    toast.error(e.message);
  }
}

async function toggleVisible(item) {
  try {
    await api.put(`/menu/items/${item.id}`, { visible: !item.visible });
    await loadItems();
  } catch (e) {
    toast.error(e.message);
  }
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  itemForm.value.image = file;
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
  imagePreview.value = URL.createObjectURL(file);
}

onUnmounted(() => {
  clearTimeout(debounceTimer);
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value);
});
</script>

<template>
  <div>
    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm flex items-center justify-between"
    >
      <span>{{ error }}</span>
      <button @click="loadData" class="underline font-medium ml-4">
        Réessayer
      </button>
    </div>

    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-text">Menu / Carte</h1>
        <p class="mt-1 text-sm text-text-muted">
          Gérez vos catégories et articles
        </p>
      </div>
      <button
        @click="openCatModal()"
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
        Catégorie
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"
      ></div>
    </div>

    <template v-else>
      <!-- Category tabs -->
      <div class="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <div
          v-for="cat in categories"
          :key="cat.id"
          class="group flex items-center shrink-0"
        >
          <button
            @click="
              activeCategory = cat.id;
              itemPage = 1;
              itemSearch = '';
            "
            class="px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-150"
            :class="
              activeCategory === cat.id
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-surface text-text-muted border-border hover:border-primary/40 hover:text-text'
            "
          >
            {{ cat.name.fr }}
          </button>
          <div
            class="ml-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              @click="openCatModal(cat)"
              class="p-1.5 rounded text-text-muted hover:text-primary hover:bg-primary/5"
              title="Modifier"
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
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                />
              </svg>
            </button>
            <button
              @click="deleteCat(cat)"
              class="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/5"
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Items list card -->
      <div class="rounded-2xl border border-border bg-surface shadow-sm">
        <!-- Toolbar -->
        <div
          class="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 border-b border-border"
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
              v-model="itemSearch"
              placeholder="Rechercher..."
              class="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <select
            v-model="itemSort"
            class="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-surface"
          >
            <option value="order">Trier: Défaut</option>
            <option value="name">Trier: Nom</option>
            <option value="price">Trier: Prix</option>
          </select>
          <button
            v-if="itemSort !== 'order'"
            @click="itemSortDir = itemSortDir === 'asc' ? 'desc' : 'asc'"
            class="inline-flex items-center justify-center w-9 h-9 border border-border rounded-lg text-text-muted hover:text-primary hover:border-primary/40 transition-colors"
            :title="itemSortDir === 'asc' ? 'Croissant' : 'Décroissant'"
          >
            <svg
              class="h-4 w-4 transition-transform"
              :class="itemSortDir === 'desc' ? 'rotate-180' : ''"
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
                d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
              />
            </svg>
            <span
              v-if="activeFilterCount"
              class="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-primary text-white text-[0.6rem] font-bold"
              >{{ activeFilterCount }}</span
            >
          </button>
          <p class="text-sm text-text-muted whitespace-nowrap">
            {{ itemTotal }} article(s)
          </p>
          <button
            @click="openItemModal()"
            :disabled="!activeCategory"
            class="ml-auto inline-flex items-center justify-center gap-2 rounded-lg bg-success px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            Article
          </button>
        </div>

        <!-- Row cards -->
        <div class="divide-y divide-border">
          <div
            v-if="!items.length"
            class="px-6 py-10 text-center text-text-muted text-sm"
          >
            {{
              activeCategory
                ? "Aucun article dans cette catégorie"
                : "Sélectionnez une catégorie"
            }}
          </div>
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-4 px-4 sm:px-6 py-3 hover:bg-surface-alt/40 transition-colors"
          >
            <!-- Thumbnail -->
            <div
              class="w-10 h-10 rounded-lg bg-surface-alt flex items-center justify-center shrink-0 overflow-hidden"
            >
              <img
                v-if="item.image && !isVideoUrl(item.image)"
                :src="item.image"
                class="w-full h-full object-cover"
              />
              <video
                v-else-if="item.image"
                :src="item.image"
                class="w-full h-full object-cover"
                muted
                playsinline
                preload="metadata"
              />
              <svg
                v-else
                class="w-5 h-5 text-text-muted/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75"
                />
              </svg>
            </div>
            <!-- Name + price -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-text truncate">
                {{ item.name.fr }}
              </p>
              <p class="text-xs text-text-muted">
                {{ item.priceStandard }} DT<span v-if="item.priceExtra">
                  · Extra {{ item.priceExtra }} DT</span
                >
              </p>
            </div>
            <!-- Status icons -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="toggleAvailability(item)"
                class="p-1.5 rounded-lg transition-colors"
                :class="
                  item.available
                    ? 'text-success hover:bg-success/10'
                    : 'text-gray-300 hover:bg-gray-100'
                "
                :title="item.available ? 'Disponible' : 'Indisponible'"
              >
                <svg
                  class="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    v-if="item.available"
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
                @click="toggleVisible(item)"
                class="p-1.5 rounded-lg transition-colors"
                :class="
                  item.visible
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-gray-300 hover:bg-gray-100'
                "
                :title="item.visible ? 'Visible' : 'Masqué'"
              >
                <svg
                  class="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    v-if="item.visible"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    v-if="item.visible"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    v-if="!item.visible"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              </button>
            </div>
            <!-- Actions -->
            <div class="flex gap-1 shrink-0">
              <button
                @click="openItemModal(item)"
                class="p-2 rounded-lg text-text-muted hover:text-primary hover:bg-primary/5 transition-colors"
                title="Modifier"
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
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                  />
                </svg>
              </button>
              <button
                @click="deleteItem(item)"
                class="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
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

        <!-- Pagination -->
        <div
          v-if="itemTotalPages > 1"
          class="flex items-center justify-between px-6 py-3 border-t border-border"
        >
          <span class="text-sm text-text-muted"
            >Page {{ itemPage }} / {{ itemTotalPages }}</span
          >
          <div class="flex gap-2">
            <button
              @click="itemPage--"
              :disabled="itemPage <= 1"
              class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
            >
              Précédent
            </button>
            <button
              @click="itemPage++"
              :disabled="itemPage >= itemTotalPages"
              class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </template>

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
              <!-- Disponibilité -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2"
                  >Disponibilité</label
                >
                <div class="flex flex-col gap-2">
                  <label
                    class="flex items-center gap-2.5 text-sm text-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="filterAvailable"
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
                      v-model="filterAvailable"
                      value="yes"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    Disponibles uniquement
                  </label>
                  <label
                    class="flex items-center gap-2.5 text-sm text-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="filterAvailable"
                      value="no"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    Indisponibles uniquement
                  </label>
                </div>
              </div>
              <!-- Visibilité -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2"
                  >Visibilité</label
                >
                <div class="flex flex-col gap-2">
                  <label
                    class="flex items-center gap-2.5 text-sm text-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="filterVisible"
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
                      v-model="filterVisible"
                      value="yes"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    Visibles uniquement
                  </label>
                  <label
                    class="flex items-center gap-2.5 text-sm text-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      v-model="filterVisible"
                      value="no"
                      class="h-4 w-4 text-primary focus:ring-primary"
                    />
                    Masqués uniquement
                  </label>
                </div>
              </div>
            </div>
            <div
              class="px-6 py-4 border-t border-border flex gap-3 justify-between"
            >
              <button
                @click="
                  filterAvailable = 'all';
                  filterVisible = 'all';
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

    <!-- Category Panel (slide-in) -->
    <Teleport to="body">
      <Transition name="slide-panel">
        <div
          v-if="showCatModal"
          class="fixed inset-0 z-50 flex justify-end"
          @click.self="showCatModal = false"
        >
          <div
            class="absolute inset-0 bg-black/30"
            @click="showCatModal = false"
          ></div>
          <div
            class="relative w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col"
          >
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-border"
            >
              <h3 class="text-lg font-semibold text-text">
                {{ editingCat ? "Modifier la" : "Nouvelle" }} catégorie
              </h3>
              <button
                @click="showCatModal = false"
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
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Nom (FR) *</label
                >
                <input
                  v-model="catForm.fr"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Name (EN)</label
                >
                <input
                  v-model="catForm.en"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >الاسم (AR)</label
                >
                <input
                  v-model="catForm.ar"
                  dir="rtl"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Ordre</label
                >
                <input
                  v-model.number="catForm.order"
                  type="number"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
            </div>
            <div
              class="px-6 py-4 border-t border-border flex gap-3 justify-end"
            >
              <button
                @click="showCatModal = false"
                class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt transition-colors"
              >
                Annuler
              </button>
              <button
                @click="saveCat"
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

    <!-- Item Panel (slide-in) -->
    <Teleport to="body">
      <Transition name="slide-panel">
        <div
          v-if="showItemModal"
          class="fixed inset-0 z-50 flex justify-end"
          @click.self="showItemModal = false"
        >
          <div
            class="absolute inset-0 bg-black/30"
            @click="showItemModal = false"
          ></div>
          <div
            class="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col"
          >
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-border"
            >
              <h3 class="text-lg font-semibold text-text">
                {{ editingItem ? "Modifier l'" : "Nouvel " }}article
              </h3>
              <button
                @click="showItemModal = false"
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
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Nom (FR) *</label
                  >
                  <input
                    v-model="itemForm.nameFr"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Name (EN)</label
                  >
                  <input
                    v-model="itemForm.nameEn"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >الاسم (AR)</label
                  >
                  <input
                    v-model="itemForm.nameAr"
                    dir="rtl"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Description (FR)</label
                >
                <textarea
                  v-model="itemForm.descFr"
                  rows="2"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
                ></textarea>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Description (EN)</label
                >
                <textarea
                  v-model="itemForm.descEn"
                  rows="2"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
                ></textarea>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >الوصف (AR)</label
                >
                <textarea
                  v-model="itemForm.descAr"
                  dir="rtl"
                  rows="2"
                  class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
                ></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Prix Standard</label
                  >
                  <input
                    v-model.number="itemForm.priceStandard"
                    type="number"
                    step="0.5"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
                <div>
                  <label
                    class="block text-xs font-medium text-text-muted mb-1.5"
                    >Prix Extra</label
                  >
                  <input
                    v-model.number="itemForm.priceExtra"
                    type="number"
                    step="0.5"
                    class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  />
                </div>
              </div>
              <!-- Image -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1.5"
                  >Image</label
                >
                <input
                  type="file"
                  accept="image/*,video/*"
                  @change="onFileChange"
                  class="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-lg file:bg-primary/10 file:text-primary file:font-medium file:cursor-pointer"
                />
                <div
                  v-if="imagePreview || (editingItem?.image && !removeImage)"
                  class="mt-2 flex items-center gap-3"
                >
                  <img
                    :src="imagePreview || editingItem?.image"
                    class="w-16 h-16 rounded-lg object-cover"
                  />
                  <button
                    @click="
                      removeImage = true;
                      imagePreview = null;
                      itemForm.image = null;
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
                    v-model="itemForm.available"
                    type="checkbox"
                    class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Disponible
                </label>
                <label class="flex items-center gap-2 text-sm text-text">
                  <input
                    v-model="itemForm.visible"
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
                @click="showItemModal = false"
                class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt transition-colors"
              >
                Annuler
              </button>
              <button
                @click="saveItem"
                :disabled="saving"
                class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {{
                  uploading
                    ? `Envoi ${uploadPct}%…`
                    : saving
                      ? "..."
                      : "Enregistrer"
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
