import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { API_BASE } from "../lib/api";

const TOKEN_KEY = "flamingo-user-token";
const UserAuthContext = createContext(null);

async function apiCall(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || "request_failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export function UserAuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || "",
  );
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Auth modal state lives here so any component can trigger it.
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");

  const persistToken = useCallback((t) => {
    setToken(t);
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  const logout = useCallback(() => {
    persistToken("");
    setUser(null);
  }, [persistToken]);

  // Hydrate the profile from an existing token on mount.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setReady(true);
      return;
    }
    apiCall("/users/me", { token })
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await apiCall("/users/login", {
        method: "POST",
        body: { email, password },
      });
      persistToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [persistToken],
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const data = await apiCall("/users/register", {
        method: "POST",
        body: { name, email, password },
      });
      persistToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [persistToken],
  );

  const toggleFavorite = useCallback(
    async (item) => {
      if (!token) {
        setAuthMode("register");
        setAuthOpen(true);
        return null;
      }
      const data = await apiCall("/users/me/favorites", {
        method: "PUT",
        token,
        body: { item },
      });
      setUser((u) => (u ? { ...u, favorites: data.favorites } : u));
      return data.added;
    },
    [token],
  );

  const isFavorite = useCallback(
    (id) => !!user?.favorites?.some((f) => f.id === Number(id)),
    [user],
  );

  const openAuth = useCallback((mode = "register") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout,
      toggleFavorite,
      isFavorite,
      authOpen,
      authMode,
      setAuthMode,
      openAuth,
      closeAuth: () => setAuthOpen(false),
    }),
    [
      token,
      user,
      ready,
      login,
      register,
      logout,
      toggleFavorite,
      isFavorite,
      authOpen,
      authMode,
      openAuth,
    ],
  );

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error("useUserAuth must be used within UserAuthProvider");
  return ctx;
}
