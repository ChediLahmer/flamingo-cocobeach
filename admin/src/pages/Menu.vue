<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { useApi } from "../composables/useApi";

const ITEMS_PER_PAGE = 10;
const api = useApi();

const categories = ref([]);
const activeCategory = ref(null);
const loading = ref(false);
const error = ref(null);
const saving = ref(false);

const itemSearch = ref("");
const itemSort = ref("order");
const itemPage = ref(1);

const showCatModal = ref(false);
const editingCat = ref(null);
const catForm = ref({ fr: "", en: "", order: 0 });

const showItemModal = ref(false);
const editingItem = ref(null);
const itemForm = ref({
  nameFr: "",
  nameEn: "",
  descFr: "",
  descEn: "",
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

const activeItems = computed(() => {
  const cat = categories.value.find((c) => c.id === activeCategory.value);
  return cat?.items || [];
});

const filteredItems = computed(() => {
  let items = activeItems.value;
  const q = itemSearch.value.toLowerCase().trim();
  if (q) {
    items = items.filter(
      (i) =>
        i.name.fr?.toLowerCase().includes(q) ||
        i.name.en?.toLowerCase().includes(q),
    );
  }
  if (itemSort.value === "name") {
    items = [...items].sort((a, b) =>
      (a.name.fr || "").localeCompare(b.name.fr || ""),
    );
  } else if (itemSort.value === "price") {
    items = [...items].sort((a, b) => a.priceStandard - b.priceStandard);
  }
  return items;
});

const totalPages = computed(() =>
  Math.ceil(filteredItems.value.length / ITEMS_PER_PAGE),
);

const paginatedItems = computed(() => {
  const start = (itemPage.value - 1) * ITEMS_PER_PAGE;
  return filteredItems.value.slice(start, start + ITEMS_PER_PAGE);
});

async function loadData() {
  if (loading.value) return;
  loading.value = true;
  error.value = null;
  try {
    categories.value = await api.get("/menu/categories");
    if (!Array.isArray(categories.value)) categories.value = [];
    if (!activeCategory.value && categories.value.length) {
      activeCategory.value = categories.value[0].id;
    }
  } catch (e) {
    error.value = e.message || "Erreur de chargement";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
watch(itemSort, () => (itemPage.value = 1));
watch(
  () => itemSearch.value,
  () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => (itemPage.value = 1), 300);
  },
);

function openCatModal(cat = null) {
  editingCat.value = cat;
  catForm.value = cat
    ? { fr: cat.name.fr, en: cat.name.en || "", order: cat.order }
    : { fr: "", en: "", order: categories.value.length };
  showCatModal.value = true;
}

async function saveCat() {
  if (!catForm.value.fr.trim()) return;
  saving.value = true;
  try {
    const data = {
      name: { fr: catForm.value.fr, en: catForm.value.en },
      order: catForm.value.order,
    };
    if (editingCat.value) {
      await api.put(`/menu/categories/${editingCat.value.id}`, data);
    } else {
      await api.post("/menu/categories", data);
    }
    showCatModal.value = false;
    await loadData();
  } catch (e) {
    error.value = e.message;
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
  } catch (e) {
    error.value = e.message;
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
        descFr: item.description?.fr || "",
        descEn: item.description?.en || "",
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
        descFr: "",
        descEn: "",
        priceStandard: 0,
        priceExtra: 0,
        image: null,
        available: true,
        visible: true,
        order: activeItems.value.length,
      };
  showItemModal.value = true;
}

async function saveItem() {
  if (!itemForm.value.nameFr.trim()) return;
  saving.value = true;
  try {
    let imageUrl = editingItem.value?.image || null;
    if (removeImage.value) {
      imageUrl = null;
    } else if (itemForm.value.image) {
      const fd = new FormData();
      fd.append("file", itemForm.value.image);
      const res = await api.upload("/upload", fd);
      imageUrl = res.url;
    }
    const payload = {
      name: { fr: itemForm.value.nameFr, en: itemForm.value.nameEn },
      description: { fr: itemForm.value.descFr, en: itemForm.value.descEn },
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
    } else {
      await api.post("/menu/items", payload);
    }
    showItemModal.value = false;
    await loadData();
  } catch (e) {
    error.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function deleteItem(item) {
  if (!confirm(`Supprimer "${item.name.fr}" ?`)) return;
  try {
    await api.del(`/menu/items/${item.id}`);
    await loadData();
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleAvailability(item) {
  try {
    await api.put(`/menu/items/${item.id}`, { available: !item.available });
    await loadData();
  } catch (e) {
    error.value = e.message;
  }
}

async function toggleVisible(item) {
  try {
    await api.put(`/menu/items/${item.id}`, { visible: !item.visible });
    await loadData();
  } catch (e) {
    error.value = e.message;
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
        Reessayer
      </button>
    </div>

    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-text">Menu / Carte</h1>
        <p class="mt-1 text-sm text-text-muted">
          Gerez vos categories et articles
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
        Categorie
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

      <!-- Items table card -->
      <div class="rounded-2xl border border-border bg-surface shadow-sm">
        <!-- Toolbar -->
        <div
          class="flex flex-col sm:flex-row sm:flex-wrap justify-between items-stretch sm:items-center gap-3 px-4 sm:px-6 py-4 border-b border-border"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
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
            <p class="text-sm text-text-muted whitespace-nowrap">
              {{ filteredItems.length }} article(s)
            </p>
            <select
              v-model="itemSort"
              class="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-surface"
            >
              <option value="order">Tri: Ordre</option>
              <option value="name">Tri: Nom</option>
              <option value="price">Tri: Prix</option>
            </select>
          </div>
          <button
            @click="openItemModal()"
            :disabled="!activeCategory"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead
              class="bg-surface-alt text-left text-text-muted text-xs uppercase tracking-wider"
            >
              <tr>
                <th class="px-6 py-3 font-medium">Nom</th>
                <th class="px-6 py-3 font-medium">Standard</th>
                <th class="px-6 py-3 font-medium">Extra</th>
                <th class="px-6 py-3 font-medium">Disponible</th>
                <th class="px-6 py-3 font-medium">Visible</th>
                <th class="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-if="!paginatedItems.length"
                class="text-center text-text-muted"
              >
                <td colspan="6" class="px-6 py-8">
                  {{
                    activeCategory
                      ? "Aucun article dans cette categorie"
                      : "Selectionnez une categorie"
                  }}
                </td>
              </tr>
              <tr
                v-for="item in paginatedItems"
                :key="item.id"
                class="hover:bg-surface-alt/50 transition-colors"
              >
                <td
                  class="px-6 py-3.5 font-medium text-text max-w-[200px] truncate"
                >
                  {{ item.name.fr }}
                </td>
                <td class="px-6 py-3.5 text-text-muted">
                  {{ item.priceStandard }} DT
                </td>
                <td class="px-6 py-3.5 text-text-muted">
                  {{ item.priceExtra }} DT
                </td>
                <td class="px-6 py-3.5">
                  <button
                    @click="toggleAvailability(item)"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                    :class="item.available ? 'bg-success' : 'bg-gray-300'"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="
                        item.available ? 'translate-x-4' : 'translate-x-0'
                      "
                    ></span>
                  </button>
                </td>
                <td class="px-6 py-3.5">
                  <button
                    @click="toggleVisible(item)"
                    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                    :class="item.visible ? 'bg-success' : 'bg-gray-300'"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="item.visible ? 'translate-x-4' : 'translate-x-0'"
                    ></span>
                  </button>
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex gap-1">
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between px-6 py-3 border-t border-border"
        >
          <span class="text-sm text-text-muted">
            Page {{ itemPage }} / {{ totalPages }}
          </span>
          <div class="flex gap-2">
            <button
              @click="itemPage--"
              :disabled="itemPage <= 1"
              class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
            >
              Precedent
            </button>
            <button
              @click="itemPage++"
              :disabled="itemPage >= totalPages"
              class="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-30 hover:bg-surface-alt transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Category Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCatModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showCatModal = false"
        >
          <div class="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold text-text mb-5">
              {{ editingCat ? "Modifier la" : "Nouvelle" }} categorie
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
              <input
                v-model.number="catForm.order"
                type="number"
                placeholder="Ordre"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
            <div class="flex gap-3 justify-end mt-6">
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

    <!-- Item Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showItemModal"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="showItemModal = false"
        >
          <div
            class="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <h3 class="text-lg font-semibold text-text mb-5">
              {{ editingItem ? "Modifier l'" : "Nouvel " }}article
            </h3>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="itemForm.nameFr"
                  placeholder="Nom (FR) *"
                  class="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
                <input
                  v-model="itemForm.nameEn"
                  placeholder="Name (EN)"
                  class="px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <textarea
                v-model="itemForm.descFr"
                placeholder="Description (FR)"
                rows="2"
                class="w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
              ></textarea>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-text-muted mb-1"
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
                  <label class="block text-xs text-text-muted mb-1"
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
                <label class="block text-xs text-text-muted mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
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
            <div class="flex gap-3 justify-end mt-6">
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
                {{ saving ? "..." : "Enregistrer" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
