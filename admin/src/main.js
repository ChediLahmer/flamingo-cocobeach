import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./style.css";

const routes = [
  { path: "/login", component: () => import("./pages/Login.vue") },
  {
    path: "/forgot-password",
    component: () => import("./pages/ForgotPassword.vue"),
  },
  {
    path: "/reset-password",
    component: () => import("./pages/ResetPassword.vue"),
  },
  {
    path: "/",
    component: () => import("./layouts/AdminLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", component: () => import("./pages/Dashboard.vue") },
      { path: "menu", component: () => import("./pages/Menu.vue") },
      { path: "spaces", component: () => import("./pages/Spaces.vue") },
      { path: "gallery", component: () => import("./pages/Gallery.vue") },
      { path: "config", component: () => import("./pages/Config.vue") },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

import { useAuth } from "./composables/useAuth";

router.beforeEach((to) => {
  if (to.meta.requiresAuth || to.matched.some((r) => r.meta.requiresAuth)) {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated()) return "/login";
  }
});

const app = createApp(App);
app.use(router);
app.mount("#app");
