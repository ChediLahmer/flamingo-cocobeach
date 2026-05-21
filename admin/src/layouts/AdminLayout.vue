<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const route = useRoute();
const { logout } = useAuth();
const collapsed = ref(false);

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/menu", label: "Menu / Carte", icon: "menu" },
  { to: "/spaces", label: "Espaces", icon: "spaces" },
  { to: "/gallery", label: "Galerie", icon: "gallery" },
  { to: "/config", label: "Configuration", icon: "config" },
];

function handleLogout() {
  logout();
  router.push("/login");
}
</script>

<template>
  <div class="flex h-screen bg-surface-alt">
    <!-- Light Sidebar -->
    <aside
      class="flex flex-col bg-surface border-r border-border transition-all duration-300 h-full"
      :class="collapsed ? 'w-[4.5rem]' : 'w-56'"
    >
      <!-- Brand -->
      <div class="flex items-center gap-3 px-4 py-5">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm"
        >
          FC
        </div>
        <div v-show="!collapsed" class="overflow-hidden">
          <h1
            class="font-display text-lg text-text tracking-wide leading-tight"
          >
            FLAMINGO
          </h1>
          <p class="text-[0.6rem] text-text-muted">Coco Beach</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.8rem] font-medium transition-all duration-150"
          :class="[
            route.path === item.to
              ? 'text-primary bg-primary/5 font-semibold'
              : 'text-text-muted hover:text-text hover:bg-surface-alt',
          ]"
        >
          <!-- Active indicator -->
          <span
            v-if="route.path === item.to"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
          ></span>

          <!-- Icons -->
          <svg
            v-if="item.icon === 'dashboard'"
            class="h-[1.15rem] w-[1.15rem] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.75"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'menu'"
            class="h-[1.15rem] w-[1.15rem] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.75"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'spaces'"
            class="h-[1.15rem] w-[1.15rem] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.75"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'gallery'"
            class="h-[1.15rem] w-[1.15rem] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.75"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'config'"
            class="h-[1.15rem] w-[1.15rem] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.75"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span v-show="!collapsed" class="truncate">{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- Bottom actions -->
      <div class="px-2 py-3 border-t border-border space-y-0.5">
        <button
          @click="collapsed = !collapsed"
          class="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[0.8rem] text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
        >
          <svg
            class="h-[1.15rem] w-[1.15rem] shrink-0 transition-transform"
            :class="{ 'rotate-180': collapsed }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.75"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
            />
          </svg>
          <span v-show="!collapsed">Réduire</span>
        </button>
        <button
          @click="handleLogout"
          class="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[0.8rem] text-danger hover:bg-danger/5 transition-colors"
        >
          <svg
            class="h-[1.15rem] w-[1.15rem] shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="1.75"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
          </svg>
          <span v-show="!collapsed">Déconnexion</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto">
      <div class="p-5 sm:p-7 lg:p-9">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </main>
  </div>
</template>
