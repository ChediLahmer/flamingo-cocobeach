import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useUserAuth } from "../auth/UserAuthContext";
import { useToast } from "./ToastContext";
import { LeafMark } from "./TropicalBackground";
import { API_BASE } from "../lib/api";

const DISMISS_KEY = "flamingo-popup-dismissed-at";
// How long to keep the popup hidden after a visitor closes it. Using a
// time-based snooze (instead of a permanent flag) means the popup comes back to
// re-encourage visitors on a later visit, while staying unobtrusive short-term.
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
// Hide once the visitor scrolls past (roughly) the hero section.
const HIDE_AFTER_PX = 200;

function isSnoozed() {
  const ts = Number(localStorage.getItem(DISMISS_KEY));
  return Number.isFinite(ts) && ts > 0 && Date.now() - ts < DISMISS_TTL_MS;
}

export default function AccountPopup({ config }) {
  const { t, localizedValue } = useLanguage();
  const { isAuthenticated, openAuth } = useUserAuth();
  const { addToast } = useToast();

  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const enabled = config?.popup_enabled !== "false";

  useEffect(() => {
    if (!enabled || isAuthenticated) return;

    // Simple rule: visible only while near the top of the page (hero area).
    // Scroll down -> hide. Scroll back up to the top -> show again.
    function update() {
      setVisible(!isSnoozed() && window.scrollY < HIDE_AFTER_PX);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [enabled, isAuthenticated]);

  function dismiss(snooze = true) {
    setVisible(false);
    if (snooze) localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  function handleCreateAccount() {
    dismiss();
    openAuth("register");
  }

  async function handleSubscribe(e) {
    e.preventDefault();
    if (submitting || !email) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/users/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      addToast(t("popup.subscribed"), "success");
      dismiss();
    } catch {
      addToast(t("common.error_unexpected"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) return null;

  const title = localizedValue(config?.popup_title) || t("popup.title");
  const text = localizedValue(config?.popup_text) || t("popup.text");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 start-4 end-4 z-[55] sm:bottom-6 sm:start-6 sm:end-auto sm:max-w-sm"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-flamingo/15">
            {/* Tropical top band */}
            <div className="relative h-24 overflow-hidden bg-gradient-to-r from-flamingo via-tropical-orange to-tropical-yellow">
              <div className="pointer-events-none absolute inset-0">
                <LeafMark
                  palette="white"
                  className="absolute -left-3 -top-4 h-24 w-24 rotate-12"
                />
                <LeafMark
                  palette="white"
                  className="absolute left-1/2 -top-6 h-20 w-20 -translate-x-1/2 -rotate-6"
                />
                <LeafMark
                  palette="white"
                  className="absolute right-2 -bottom-8 h-24 w-24 rotate-180"
                />
              </div>
              <button
                onClick={() => dismiss()}
                className="absolute end-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/30 text-white backdrop-blur hover:bg-white/50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              <h3 className="font-display text-2xl tracking-wide text-gray-900">
                {title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {text}
              </p>

              <button
                onClick={handleCreateAccount}
                className="mt-4 w-full rounded-full bg-flamingo py-2.5 text-sm font-semibold text-white shadow-lg shadow-flamingo/30 transition hover:bg-flamingo-dark"
              >
                {t("popup.cta")}
              </button>

              <div className="my-3 flex items-center gap-3 text-[0.7rem] uppercase tracking-widest text-gray-300">
                <span className="h-px flex-1 bg-gray-200" />
                {t("popup.or")}
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("popup.email_placeholder")}
                  dir="ltr"
                  className="min-w-0 flex-1 rounded-full border border-flamingo/20 bg-sand px-4 py-2 text-sm outline-none focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 rounded-full bg-tropical-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                >
                  →
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
