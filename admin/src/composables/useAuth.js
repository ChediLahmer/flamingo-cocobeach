import { ref } from "vue";

const token = ref(localStorage.getItem("token") || "");

function isTokenExpired(t) {
  if (!t) return true;
  try {
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function useAuth() {
  function login(t) {
    token.value = t;
    localStorage.setItem("token", t);
  }

  function logout() {
    token.value = "";
    localStorage.removeItem("token");
  }

  return {
    token,
    login,
    logout,
    isAuthenticated: () => !!token.value && !isTokenExpired(token.value),
  };
}
