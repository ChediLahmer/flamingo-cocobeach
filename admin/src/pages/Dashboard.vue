<template>
  <div>
    <!-- Welcome Banner -->
    <div class="mb-8">
      <h1 class="font-display text-4xl text-text tracking-wide">DASHBOARD</h1>
      <p class="mt-1 text-sm text-text-muted">
        Vue d’ensemble de votre beach bar
      </p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-2xl border border-border bg-surface shadow-sm p-5 hover:shadow-md hover:border-primary/30 transition-all group"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold mb-3 transition-transform group-hover:scale-110"
          :class="stat.color"
        >
          {{ stat.short }}
        </div>
        <div class="text-3xl font-bold text-text">{{ stat.value }}</div>
        <div class="text-sm text-text-muted mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="mt-8">
      <h2 class="font-display text-2xl text-text tracking-wide mb-4">
        ACTIONS RAPIDES
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <router-link
          to="/menu"
          class="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <div
            class="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold"
          >
            +
          </div>
          <span class="text-sm font-medium text-text">Ajouter un plat</span>
        </router-link>
        <router-link
          to="/gallery"
          class="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <div
            class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold"
          >
            +
          </div>
          <span class="text-sm font-medium text-text">Ajouter des photos</span>
        </router-link>
        <router-link
          to="/config"
          class="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <div
            class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold"
          >
            ⚡
          </div>
          <span class="text-sm font-medium text-text">Modifier les infos</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useApi } from "../composables/useApi";

const api = useApi();

const stats = ref([
  {
    short: "MN",
    label: "Catégories Menu",
    value: "—",
    color: "bg-pink-100 text-pink-600",
  },
  {
    short: "ES",
    label: "Espaces",
    value: "—",
    color: "bg-teal-100 text-teal-600",
  },
  {
    short: "GL",
    label: "Photos Galerie",
    value: "—",
    color: "bg-orange-100 text-orange-600",
  },
  {
    short: "CF",
    label: "Configurations",
    value: "—",
    color: "bg-purple-100 text-purple-600",
  },
]);

onMounted(async () => {
  try {
    const [menu, spaces, gallery, config] = await Promise.all([
      api.get("/menu/categories"),
      api.get("/spaces"),
      api.get("/gallery"),
      api.get("/config"),
    ]);
    stats.value[0].value = menu.length;
    stats.value[1].value = spaces.total;
    stats.value[2].value = gallery.items.length;
    stats.value[3].value = Object.keys(config).length;
  } catch {
    /* ignore */
  }
});
</script>
