import { useAuth } from "./useAuth";

const BASE = import.meta.env.VITE_API_URL || "/api";

export function useApi() {
  const { token } = useAuth();

  async function request(path, options = {}) {
    const headers = { ...options.headers };
    if (token.value) headers.Authorization = `Bearer ${token.value}`;
    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    if (res.status === 204) return null;
    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.message || err.error || "Request failed");
    }
    return res.json();
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    del: (path) => request(path, { method: "DELETE" }),
    upload: (path, formData) =>
      request(path, { method: "POST", body: formData }),
  };
}
