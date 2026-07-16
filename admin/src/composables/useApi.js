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

  // XHR wrapper so uploads can report progress (fetch cannot). Resolves parsed
  // JSON (or null) and rejects with a friendly message; handles 401 / 413.
  function xhrSend(method, url, body, { headers = {}, onProgress } = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v);
      }
      if (onProgress && xhr.upload) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (xhr.status === 204 || !xhr.responseText) return resolve(null);
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(null);
          }
          return;
        }
        if (xhr.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return reject(new Error("Session expired"));
        }
        let msg;
        try {
          const j = JSON.parse(xhr.responseText);
          msg = j.message || j.error;
        } catch {
          msg = xhr.responseText;
        }
        if (xhr.status === 413) msg = "Fichier trop volumineux";
        reject(new Error(msg || "Échec de l'envoi"));
      });
      xhr.addEventListener("error", () => reject(new Error("Erreur réseau")));
      xhr.addEventListener("timeout", () =>
        reject(new Error("La requête a expiré. Réessayez.")),
      );
      xhr.send(body);
    });
  }

  // Videos upload presigned direct-to-storage (under incoming/) and are
  // transcoded/promoted in the background, bypassing the sync 50MB/proxy path.
  // onProgress(percent) reports the direct-to-storage upload progress.
  async function uploadVideoPresigned(file, onProgress) {
    const contentType = file.type || "video/mp4";
    const presign = await request("/upload/presign", {
      method: "POST",
      body: { filename: file.name, contentType, sizeBytes: file.size },
    });
    // Only Content-Type may be signed for the browser PUT.
    await xhrSend("PUT", presign.url, file, {
      headers: { "Content-Type": contentType },
      onProgress,
    });
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
    upload: async (path, formData, { onProgress } = {}) => {
      const file = formData.get?.("file");
      if (isVideoFile(file)) {
        const { url } = await uploadVideoPresigned(file, onProgress);
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
      // Sync multipart (images) via XHR so we get upload progress too.
      const headers = token.value
        ? { Authorization: `Bearer ${token.value}` }
        : {};
      return xhrSend("POST", `${BASE}${path}`, formData, {
        headers,
        onProgress,
      });
    },
  };
}
