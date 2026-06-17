<script setup>
import { ref, computed, onMounted } from "vue";
import { useApi } from "../composables/useApi";
import { useToast } from "../composables/useToast";

const api = useApi();
const toast = useToast();

const testimonials = ref([]);
const loading = ref(false);
const error = ref(null);
const showForm = ref(false);
const editing = ref(null);
const saving = ref(false);

function blankForm() {
  return {
    name: "",
    roleFr: "",
    roleEn: "",
    roleAr: "",
    commentFr: "",
    commentEn: "",
    commentAr: "",
    rating: 5,
    visible: true,
    order: 0,
  };
}

const form = ref(blankForm());

async function load() {
  loading.value = true;
  error.value = null;
  try {
    testimonials.value = await api.get("/testimonials");
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const stats = computed(() => ({
  total: testimonials.value.length,
  visible: testimonials.value.filter((t) => t.visible).length,
  hidden: testimonials.value.filter((t) => !t.visible).length,
}));

function openForm(item = null) {
  editing.value = item;
  if (item) {
    form.value = {
      name: item.name,
      roleFr: item.role?.fr || "",
      roleEn: item.role?.en || "",
      roleAr: item.role?.ar || "",
      commentFr: item.comment?.fr || "",
      commentEn: item.comment?.en || "",
      commentAr: item.comment?.ar || "",
      rating: item.rating,
      visible: item.visible,
      order: item.order || 0,
    };
  } else {
    form.value = blankForm();
  }
  showForm.value = true;
}

async function save() {
  if (!form.value.name.trim()) {
    toast.error("Le nom est requis.");
    return;
  }
  if (
    !form.value.commentFr.trim() ||
    !form.value.commentEn.trim() ||
    !form.value.commentAr.trim()
  ) {
    toast.error("Le commentaire est requis en français, anglais et arabe.");
    return;
  }
  saving.value = true;
  try {
    const hasRole =
      form.value.roleFr.trim() ||
      form.value.roleEn.trim() ||
      form.value.roleAr.trim();
    const data = {
      name: form.value.name,
      role: hasRole
        ? {
            fr: form.value.roleFr,
            en: form.value.roleEn,
            ar: form.value.roleAr,
          }
        : null,
      comment: {
        fr: form.value.commentFr,
        en: form.value.commentEn,
        ar: form.value.commentAr,
      },
      rating: Number(form.value.rating),
      visible: form.value.visible,
      order: Number(form.value.order) || 0,
    };
    if (editing.value) {
      await api.put(`/testimonials/${editing.value.id}`, data);
      toast.success("Témoignage mis à jour.");
    } else {
      await api.post("/testimonials", data);
      toast.success("Témoignage créé.");
    }
    showForm.value = false;
    await load();
  } catch (e) {
    toast.error(e.message);
  } finally {
    saving.value = false;
  }
}

async function remove(item) {
  if (!confirm(`Supprimer le témoignage de "${item.name}" ?`)) return;
  try {
    await api.del(`/testimonials/${item.id}`);
    await load();
    toast.success("Témoignage supprimé.");
  } catch (e) {
    toast.error(e.message);
  }
}

async function toggleVisible(item) {
  try {
    await api.put(`/testimonials/${item.id}`, { visible: !item.visible });
    await load();
  } catch (e) {
    toast.error(e.message);
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
        Réessayer
      </button>
    </div>

    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-text">Témoignages</h1>
        <p class="mt-1 text-sm text-text-muted">
          Gérez les avis affichés sur le site
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
        Nouveau témoignage
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p class="text-xs text-text-muted">Total</p>
        <p class="text-2xl font-bold text-text">{{ stats.total }}</p>
      </div>
      <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p class="text-xs text-text-muted">Affichés</p>
        <p class="text-2xl font-bold text-success">{{ stats.visible }}</p>
      </div>
      <div class="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p class="text-xs text-text-muted">Masqués</p>
        <p class="text-2xl font-bold text-text-muted">{{ stats.hidden }}</p>
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
      v-else-if="testimonials.length === 0"
      class="rounded-2xl border border-dashed border-border bg-surface p-12 text-center"
    >
      <div class="text-4xl mb-3">💬</div>
      <p class="text-text-muted">Aucun témoignage pour le moment.</p>
    </div>

    <!-- List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div
        v-for="item in testimonials"
        :key="item.id"
        class="rounded-2xl border border-border bg-surface shadow-sm p-5 hover:shadow-md transition-shadow"
        :class="{ 'opacity-60': !item.visible }"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white"
            >
              {{ item.name.slice(0, 1).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-text truncate">{{ item.name }}</p>
              <p class="text-xs text-text-muted truncate">
                {{ item.role?.fr || "—" }}
              </p>
            </div>
          </div>
          <div class="flex gap-0.5 text-amber-400 shrink-0">
            <span v-for="n in item.rating" :key="n">★</span>
          </div>
        </div>

        <p class="mt-3 text-sm text-text-muted line-clamp-3 min-h-[3.5rem]">
          {{ item.comment?.fr }}
        </p>

        <div class="mt-4 flex items-center gap-2">
          <button
            @click="openForm(item)"
            class="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:border-primary/40 hover:text-primary transition-colors"
          >
            Modifier
          </button>
          <button
            @click="toggleVisible(item)"
            class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors"
            :class="
              item.visible
                ? 'text-success hover:bg-success/5'
                : 'text-text-muted hover:bg-surface-alt'
            "
          >
            {{ item.visible ? "Affiché" : "Masqué" }}
          </button>
          <button
            @click="remove(item)"
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
            {{ editing ? "Modifier le témoignage" : "Nouveau témoignage" }}
          </h2>
          <button
            @click="showForm = false"
            class="text-text-muted hover:text-text text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div class="p-6 space-y-5">
          <!-- Name + rating -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-text-muted mb-1"
                >Nom *</label
              >
              <input
                v-model="form.name"
                maxlength="100"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1"
                >Note</label
              >
              <select
                v-model.number="form.rating"
                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-surface"
              >
                <option v-for="n in 5" :key="n" :value="n">
                  {{ n }} étoile{{ n > 1 ? "s" : "" }}
                </option>
              </select>
            </div>
          </div>

          <!-- Role -->
          <div>
            <label class="block text-xs font-medium text-text-muted mb-2"
              >Rôle / Légende (optionnel)</label
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
                    form[`role${lang.charAt(0).toUpperCase() + lang.slice(1)}`]
                  "
                  :dir="lang === 'ar' ? 'rtl' : 'ltr'"
                  class="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <!-- Comment -->
          <div>
            <label class="block text-xs font-medium text-text-muted mb-2"
              >Commentaire *</label
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
                    form[
                      `comment${lang.charAt(0).toUpperCase() + lang.slice(1)}`
                    ]
                  "
                  :dir="lang === 'ar' ? 'rtl' : 'ltr'"
                  rows="2"
                  class="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-text">
              <input v-model="form.visible" type="checkbox" class="rounded" />
              Afficher sur le site
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
