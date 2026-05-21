import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import "./style.css";

const routes = [
  { path: "/login", component: () => import("./pages/Login.vue") },
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

router.beforeEach((to) => {
  if (to.meta.requiresAuth || to.matched.some((r) => r.meta.requiresAuth)) {
    const token = localStorage.getItem("token");
    if (!token) return "/login";
  }
});

const app = createApp(App);
app.use(router);
app.mount("#app");
