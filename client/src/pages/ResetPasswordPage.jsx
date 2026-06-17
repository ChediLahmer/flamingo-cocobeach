import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { API_BASE } from "../lib/api";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError(t("auth.password_hint"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.passwords_mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) throw new Error("failed");
      setSuccess(true);
    } catch {
      setError(t("auth.reset_invalid"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-sand shadow-2xl">
        <div className="bg-gradient-to-br from-flamingo via-flamingo-dark to-tropical-orange px-8 pb-8 pt-7 text-center">
          <div className="text-5xl">🦩</div>
          <h1 className="mt-2 font-display text-2xl tracking-wider text-white">
            {t("auth.reset_title")}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {t("auth.reset_subtitle")}
          </p>
        </div>

        <div className="px-8 py-7">
          {!token ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-gray-600">{t("auth.reset_invalid")}</p>
              <Link
                to="/"
                className="font-semibold text-flamingo hover:underline"
              >
                {t("auth.back_home")}
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
                ✓
              </div>
              <p className="text-sm text-gray-600">{t("auth.reset_success")}</p>
              <button
                onClick={() => navigate("/")}
                className="rounded-full bg-flamingo px-6 py-2.5 font-semibold text-white transition hover:bg-flamingo-dark"
              >
                {t("auth.back_home")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("auth.new_password")}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-flamingo/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {t("auth.password_hint")}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("auth.confirm_password")}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-flamingo/20 bg-white px-4 py-3 text-sm outline-none transition focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-flamingo py-3 font-semibold text-white shadow-lg shadow-flamingo/30 transition hover:bg-flamingo-dark disabled:opacity-60"
              >
                {submitting ? t("common.loading") : t("auth.reset_submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
