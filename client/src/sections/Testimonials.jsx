import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useTimeTheme } from "../theme/useTimeTheme";
import { useUserAuth } from "../auth/UserAuthContext";
import { useToast } from "../components/ToastContext";
import { API_BASE } from "../lib/api";

const AVATAR_GRADIENTS = [
  "from-flamingo to-tropical-orange",
  "from-tropical-teal to-ocean",
  "from-tropical-yellow to-tropical-orange",
  "from-flamingo-dark to-flamingo",
  "from-tropical-green to-tropical-teal",
];

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Stars({ count = 5 }) {
  return (
    <div className="flex justify-center gap-1 text-tropical-yellow" aria-hidden>
      {Array.from({ length: Math.max(1, Math.min(5, count)) }).map((_, i) => (
        <svg
          key={i}
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

const THEME = {
  night: {
    label: "text-tropical-yellow",
    title: "text-white",
    chip: "border-white/20 bg-white/10 text-white/80",
    chipNum: "text-tropical-yellow",
    card: "border-white/15 bg-white/10 text-white",
    quote: "text-white/95",
    name: "text-white",
    role: "text-white/70",
    mark: "text-tropical-yellow/60",
    ring: "ring-white/30",
    ctrl: "border-white/25 bg-white/10 text-white hover:bg-white/20",
    dotActive: "bg-tropical-yellow",
    dotIdle: "bg-white/40 hover:bg-white/70",
  },
  day: {
    label: "text-flamingo",
    title: "text-gray-900",
    chip: "border-flamingo/15 bg-white/70 text-gray-600",
    chipNum: "text-flamingo",
    card: "border-flamingo/10 bg-white/80 text-gray-800",
    quote: "text-gray-700",
    name: "text-gray-900",
    role: "text-gray-500",
    mark: "text-flamingo/30",
    ring: "ring-white/70",
    ctrl: "border-flamingo/20 bg-white/70 text-flamingo hover:bg-white",
    dotActive: "bg-flamingo",
    dotIdle: "bg-gray-300 hover:bg-gray-400",
  },
};

export default function Testimonials() {
  const { t, localizedValue } = useLanguage();
  const { isNight } = useTimeTheme();
  const { isAuthenticated, token, openAuth } = useUserAuth();
  const { addToast } = useToast();
  const ui = isNight ? THEME.night : THEME.day;

  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openReview() {
    if (!isAuthenticated) {
      addToast(t("testimonials.login_required"), "info");
      openAuth("register");
      return;
    }
    setReviewRating(5);
    setReviewText("");
    setFormOpen(true);
  }

  async function submitReview(e) {
    e.preventDefault();
    if (submitting || !reviewText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/testimonials/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: reviewText.trim(),
          rating: reviewRating,
        }),
      });
      if (!res.ok) throw new Error("failed");
      addToast(t("testimonials.submitted"), "success");
      setFormOpen(false);
    } catch {
      addToast(t("common.error_unexpected"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/testimonials`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setItems(
          data.map((d) => ({
            text: localizedValue(d.comment),
            name: d.name,
            role: localizedValue(d.role),
            rating: d.rating || 5,
          })),
        );
        setActive(0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localizedValue]);

  const count = items.length;

  const go = useCallback(
    (dir) => setActive((i) => (i + dir + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), 5500);
    return () => clearInterval(id);
  }, [paused, count]);

  const current = items[active] || items[0];

  return (
    <section
      className="relative overflow-hidden py-28 sm:py-36"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* At night, a soft vertically-fading veil deepens the centre for white
          text while blending edge-to-edge with the global background. */}
      {isNight && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/55 to-transparent" />
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span
            className={`text-sm font-semibold uppercase tracking-[0.3em] ${ui.label}`}
          >
            {t("testimonials.label")}
          </span>
          <h2
            className={`mt-3 font-display text-5xl tracking-wide drop-shadow-sm md:text-7xl ${ui.title}`}
          >
            {t("testimonials.title")}
          </h2>

          {/* Rating chip */}
          <div
            className={`mt-5 inline-flex items-center gap-3 rounded-full border px-5 py-2 backdrop-blur ${ui.chip}`}
          >
            <span className={`font-display text-2xl ${ui.chipNum}`}>4.9</span>
            <span className="text-sm">{t("testimonials.rating_label")}</span>
          </div>
        </motion.div>

        {/* Floating community avatars */}
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          {items.map((item, i) => {
            if (i === active) return null;
            const spots = [
              { top: "12%", left: "6%", size: "3.5rem", blur: "blur-[1px]" },
              { top: "26%", right: "8%", size: "4rem", blur: "" },
              { bottom: "30%", left: "10%", size: "3rem", blur: "blur-[2px]" },
              { bottom: "18%", right: "12%", size: "3.5rem", blur: "" },
              { top: "60%", left: "3%", size: "2.75rem", blur: "blur-[1px]" },
            ];
            const s = spots[i % spots.length];
            return (
              <motion.div
                key={item.name}
                className={`absolute animate-float ${s.blur}`}
                style={{ ...s, animationDelay: `${i * 0.7}s` }}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 0.85, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div
                  className={`grid place-items-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} font-semibold text-white shadow-xl ring-2 ${ui.ring}`}
                  style={{ width: s.size, height: s.size }}
                >
                  {initials(item.name)}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rotating quote stage */}
        {count > 0 ? (
          <>
            <div className="relative mx-auto mt-12 min-h-[20rem] max-w-2xl">
              {/* big quote mark */}
              <svg
                className={`mx-auto mb-2 h-14 w-14 ${ui.mark}`}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm9 0A5.17 5.17 0 0011 11.17V18h6.83v-6.83H14.5a1.67 1.67 0 011.67-1.67V6z" />
              </svg>

              <AnimatePresence mode="wait">
                <motion.figure
                  key={active}
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.97 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`rounded-[2rem] border p-8 shadow-2xl backdrop-blur-xl sm:p-10 ${ui.card}`}
                >
                  <Stars count={current.rating} />
                  <blockquote
                    className={`mt-5 text-xl font-light leading-relaxed sm:text-2xl ${ui.quote}`}
                  >
                    {current.text}
                  </blockquote>
                  <figcaption className="mt-7 flex items-center justify-center gap-4">
                    <div
                      className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[active % AVATAR_GRADIENTS.length]} text-lg font-bold text-white shadow-lg ring-2 ${ui.ring}`}
                    >
                      {initials(current.name)}
                    </div>
                    <div className="text-start">
                      <div className={`font-semibold ${ui.name}`}>
                        {current.name}
                      </div>
                      <div className={`text-sm ${ui.role}`}>{current.role}</div>
                    </div>
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="mt-10 flex items-center justify-center gap-5">
              <button
                onClick={() => go(-1)}
                className={`grid h-11 w-11 place-items-center rounded-full border backdrop-blur transition ${ui.ctrl}`}
                aria-label={t("common.previous")}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {items.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`${i + 1}`}
                    className={`h-2.5 rounded-full transition-all ${
                      i === active
                        ? `w-8 ${ui.dotActive}`
                        : `w-2.5 ${ui.dotIdle}`
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => go(1)}
                className={`grid h-11 w-11 place-items-center rounded-full border backdrop-blur transition ${ui.ctrl}`}
                aria-label={t("common.next")}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <p className={`mt-12 text-lg ${ui.role}`}>
            {t("testimonials.empty")}
          </p>
        )}

        {/* Share-your-experience CTA */}
        <div className="mt-12">
          <button
            onClick={openReview}
            className={`inline-flex items-center gap-2 rounded-full border px-7 py-3 font-semibold backdrop-blur transition ${ui.ctrl}`}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {t("testimonials.share_cta")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setFormOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-sand shadow-2xl"
              initial={{ scale: 0.92, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 24, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="bg-gradient-to-br from-flamingo via-flamingo-dark to-tropical-orange px-8 pb-7 pt-7 text-center">
                <button
                  onClick={() => setFormOpen(false)}
                  className="absolute end-4 top-4 text-2xl leading-none text-white/80 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
                <div className="text-4xl">🌴</div>
                <h3 className="mt-2 font-display text-2xl tracking-wider text-white">
                  {t("testimonials.share_title")}
                </h3>
                <p className="mt-1 text-sm text-white/80">
                  {t("testimonials.share_subtitle")}
                </p>
              </div>

              <form onSubmit={submitReview} className="space-y-5 px-8 py-7">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("testimonials.your_rating")}
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setReviewRating(n)}
                        aria-label={`${n}`}
                        className={
                          n <= reviewRating
                            ? "text-tropical-yellow"
                            : "text-gray-300"
                        }
                      >
                        <svg
                          className="h-8 w-8"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("testimonials.your_comment")}
                  </label>
                  <textarea
                    required
                    rows={4}
                    maxLength={600}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full rounded-xl border border-flamingo/20 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-flamingo focus:ring-2 focus:ring-flamingo/20"
                    placeholder={t("testimonials.comment_placeholder")}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-flamingo py-3 font-semibold text-white shadow-lg shadow-flamingo/30 transition hover:bg-flamingo-dark disabled:opacity-60"
                >
                  {submitting ? t("common.loading") : t("testimonials.submit")}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
