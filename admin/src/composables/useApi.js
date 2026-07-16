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

  function isVideoFile(file) {
    if (!file) return false;
    if (file.type?.startsWith("video/")) return true;
    return /\.(mp4|webm|ogg|mov|m4v|mkv|avi)$/i.test(file.name || "");
  }

  // Videos upload presigned direct-to-storage (under incoming/) and are
  // transcoded/promoted in the background, bypassing the sync 50MB/proxy path.
  async function uploadVideoPresigned(file) {
    const contentType = file.type || "video/mp4";
    const presign = await request("/upload/presign", {
      method: "POST",
      body: { filename: file.name, contentType, sizeBytes: file.size },
    });
    const putRes = await fetch(presign.url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error(`Échec de l'envoi vers le stockage (${putRes.status})`);
    }
    return { url: presign.publicUrl };
  }

  // Kick the background promote/transcode once an entity is saved with an
  // incoming/ URL. Fire-and-forget; the boot + weekly sweeps are the fallback.
  function maybeTriggerProcessing(body) {
    try {
      const s = typeof body === "string" ? body : JSON.stringify(body || "");
      if (s.includes("/incoming/")) {
        request("/upload/process-incoming", { method: "POST" }).catch(() => {});
      }
    } catch {
      /* ignore */
    }
  }

  return {
    get: (path) => request(path),
    post: async (path, body) => {
      const res = await request(path, { method: "POST", body });
      maybeTriggerProcessing(body);
      return res;
    },
    put: async (path, body) => {
      const res = await request(path, { method: "PUT", body });
      maybeTriggerProcessing(body);
      return res;
    },
    del: (path) => request(path, { method: "DELETE" }),
    upload: async (path, formData) => {
      const file = formData.get?.("file");
      if (isVideoFile(file)) {
        const { url } = await uploadVideoPresigned(file);
        // /upload just returns the URL; the page then saves the entity and the
        // post/put trigger kicks processing. Direct-create endpoints such as
        // /gallery accept a JSON { url } body, so create + trigger here.
        if (path === "/upload") return { url };
        const categoryId = formData.get?.("categoryId");
        const res = await request(path, {
          method: "POST",
          body: categoryId ? { url, categoryId } : { url },
        });
        maybeTriggerProcessing({ url });
        return res;
      }
      return request(path, { method: "POST", body: formData });
    },
  };
}
