import { ref } from "vue";

const token = ref(localStorage.getItem("token") || "");

export function useAuth() {
  function login(t) {
    token.value = t;
    localStorage.setItem("token", t);
  }

  function logout() {
    token.value = "";
    localStorage.removeItem("token");
  }

  return { token, login, logout, isAuthenticated: () => !!token.value };
}
