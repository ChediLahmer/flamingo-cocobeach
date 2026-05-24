import { useState, useCallback } from "react";
import { useToast } from "../components/ToastContext";
import { useLanguage } from "../i18n/LanguageContext";

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function apiFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiError(0, "network");
  }

  if (!res.ok) {
    let msg = "";
    try {
      const body = await res.json();
      msg = body.error || body.message || "";
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, msg || res.statusText);
  }

  if (res.status === 204) return null;
  return res.json();
}

function getErrorKey(status) {
  if (status === 0) return "common.error_network";
  if (status === 403) return "common.error_forbidden";
  if (status === 404) return "common.error_not_found";
  if (status >= 500) return "common.error_server";
  return "common.error_unexpected";
}

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();
  const { t } = useLanguage();

  const request = useCallback(
    async (url, options = {}, { silent = false } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(url, options);
        return data;
      } catch (err) {
        const key = getErrorKey(err.status);
        setError(key);
        if (!silent) {
          addToast(t(key), "error");
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [addToast, t],
  );

  const get = useCallback(
    (url, opts) => request(url, undefined, opts),
    [request],
  );

  return { get, request, loading, error };
}
