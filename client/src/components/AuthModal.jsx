import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserAuth } from "../auth/UserAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import { useToast } from "./ToastContext";
import { API_BASE } from "../lib/api";

export default function AuthModal() {
  const { authOpen, authMode, setAuthMode, closeAuth, login, register } =
    useUserAuth();
  const { t } = useLanguage();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const isRegister = authMode === "register";

  useEffect(() => {
    if (!authOpen) {
      setName("");
      setEmail("");
      setPassword("");
      setSubmitting(false);
      setForgot(false);
      setForgotSent(false);
    }
  }, [authOpen]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAuth();
    }
    if (authOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authOpen, closeAuth]);

  async function handleForgot(e) {
    e.preventDefault();
    if (submitting || !email) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      setForgotSent(true);
    } catch {
      addToast(t("common.error_unexpected"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (isRegister && password.length < 8) {
      addToast(t("auth.password_hint"), "error");
      return;
    }
    setSubmitting(true);
    try {
      if (isRegister) {
        await register({ name, email, password });
        addToast(t("auth.welcome"), "success");
      } else {
        await login(email, password);
        addToast(t("auth.logged_in"), "success");
      }
      closeAuth();
    } catch (err) {
      const msg =
        err.status === 409
          ? t("auth.email_taken")
          : err.status === 401
            ? t("auth.invalid")
            : t("common.error_unexpected");
      addToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeAuth}
          />
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-sand shadow-2xl"
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 24, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            {/* Tropical header */}
            <div className="relative bg-gradient-to-br from-flamingo via-flamingo-dark to-tropical-orange px-8 pb-10 pt-8 text-center">
              <button
                onClick={closeAuth}
                className="absolute end-4 top-4 text-2xl leading-none text-white/80 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="text-5xl">🦩</div>
              <h2 className="mt-2 font-display text-3xl tracking-wider text-white">
                {forgot
                  ? t("auth.forgot_title")
                  : isRegister
                    ? t("auth.join_title")
                    : t("auth.welcome_back")}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {forgot
                  ? t("auth.forgot_subtitle")
                  : isRegister
                    ? t("auth.join_subtitle")
                    : t("auth.login_subtitle")}
              </p>
            </div>

            {forgot ? (
              <div className="space-y-4 px-8 py-7">
                {forgotSent ? (
                  <div className="space-y-5 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
                      ✓
                    </div>
                    <p className="text-sm text-gray-600">
                      {t("auth.forgot_sent")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setForgot(false)}
                      className="font-semibold text-flamingo hover:underline"
                    >
                      {t("auth.back_to_login")}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <p className="text-sm text-gray-500">
                      {t("auth.forgot_help")}
                    </p>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {t("auth.email")}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-flamingo/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                        placeholder="you@email.com"
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-full bg-flamingo py-3 font-semibold text-white shadow-lg shadow-flamingo/30 transition hover:bg-flamingo-dark disabled:opacity-60"
                    >
                      {submitting
                        ? t("common.loading")
                        : t("auth.send_reset_link")}
                    </button>
                    <p className="text-center text-sm text-gray-500">
                      <button
                        type="button"
                        onClick={() => setForgot(false)}
                        className="font-semibold text-flamingo hover:underline"
                      >
                        {t("auth.back_to_login")}
                      </button>
                    </p>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 px-8 py-7">
                {isRegister && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {t("auth.name")}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={80}
                      className="w-full rounded-xl border border-flamingo/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                      placeholder={t("auth.name_placeholder")}
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("auth.email")}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-flamingo/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                    placeholder="you@email.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("auth.password")}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={isRegister ? 8 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-flamingo/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  {isRegister && (
                    <p className="mt-1 text-xs text-gray-400">
                      {t("auth.password_hint")}
                    </p>
                  )}
                </div>

                {!isRegister && (
                  <div className="text-end">
                    <button
                      type="button"
                      onClick={() => setForgot(true)}
                      className="text-xs font-semibold text-flamingo hover:underline"
                    >
                      {t("auth.forgot_link")}
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-flamingo py-3 font-semibold text-white shadow-lg shadow-flamingo/30 transition hover:bg-flamingo-dark disabled:opacity-60"
                >
                  {submitting
                    ? t("common.loading")
                    : isRegister
                      ? t("auth.create_account")
                      : t("auth.login")}
                </button>

                <p className="text-center text-sm text-gray-500">
                  {isRegister ? t("auth.have_account") : t("auth.no_account")}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setAuthMode(isRegister ? "login" : "register")
                    }
                    className="font-semibold text-flamingo hover:underline"
                  >
                    {isRegister ? t("auth.login") : t("auth.create_account")}
                  </button>
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
