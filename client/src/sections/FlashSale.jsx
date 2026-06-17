import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { API_BASE } from "../lib/api";

function getRemaining(endsAt) {
  const total = new Date(endsAt).getTime() - Date.now();
  if (total <= 0) return null;
  return {
    total,
    days: Math.floor(total / 86400000),
    hours: Math.floor((total / 3600000) % 24),
    minutes: Math.floor((total / 60000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function Countdown({ endsAt, labels }) {
  const [r, setR] = useState(() => getRemaining(endsAt));
  useEffect(() => {
    const id = setInterval(() => setR(getRemaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!r) return null;
  const units = [
    { v: r.days, l: labels.d },
    { v: r.hours, l: labels.h },
    { v: r.minutes, l: labels.m },
    { v: r.seconds, l: labels.s },
  ];
  return (
    <div className="flex gap-1.5" dir="ltr">
      {units.map((u, i) => (
        <div
          key={i}
          className="min-w-[2.6rem] rounded-lg border border-white/20 bg-white/10 px-1.5 py-1 text-center backdrop-blur"
        >
          <div className="text-base font-bold leading-none text-white">
            {String(u.v).padStart(2, "0")}
          </div>
          <div className="mt-0.5 text-[0.55rem] uppercase tracking-wide text-white/60">
            {u.l}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FlashSale() {
  const { t, localizedValue, dir } = useLanguage();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/flash-sales`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setSales(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // Use absolute scrollLeft so RTL (negative scrollLeft) is handled uniformly.
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setAtStart(pos <= 2);
    setAtEnd(pos >= max - 2);
  }, []);

  useEffect(() => {
    updateEdges();
  }, [sales, updateEdges]);

  function page(direction) {
    const el = trackRef.current;
    if (!el) return;
    // Scroll by ~one viewport so it advances to the next "page" of cards.
    const amount = el.clientWidth * 0.9 * direction;
    el.scrollBy({
      left: dir === "rtl" ? -amount : amount,
      behavior: "smooth",
    });
  }

  // Autoplay: advance one page every 5s; loop back to the start at the end.
  // Pauses on hover/touch so it doesn't fight with the user.
  useEffect(() => {
    if (sales.length <= 1) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el || pausedRef.current) return;
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      if (pos >= max - 2) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        page(1);
      }
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales.length, dir]);

  if (loading || sales.length === 0) return null;

  const labels = {
    d: t("flash.days"),
    h: t("flash.hours"),
    m: t("flash.minutes"),
    s: t("flash.seconds"),
  };

  return (
    <section id="flash" className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-flamingo/[0.06] to-transparent" />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-start">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-flamingo/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-flamingo-dark"
            >
              ⚡ {t("flash.kicker")}
            </motion.span>
            <h2 className="mt-4 font-display text-5xl text-gray-900 md:text-7xl">
              {t("flash.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 sm:mx-0">
              {t("flash.subtitle")}
            </p>
          </div>

          {/* Pager arrows — navigate to the next set of offers */}
          {sales.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => page(-1)}
                disabled={atStart}
                aria-label={t("common.previous")}
                className="grid h-11 w-11 place-items-center rounded-full border border-flamingo/25 bg-white/70 text-flamingo-dark shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg
                  className="h-5 w-5 rtl:rotate-180"
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
              <button
                onClick={() => page(1)}
                disabled={atEnd}
                aria-label={t("common.next")}
                className="grid h-11 w-11 place-items-center rounded-full border border-flamingo/25 bg-white/70 text-flamingo-dark shadow-sm backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <svg
                  className="h-5 w-5 rtl:rotate-180"
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
          )}
        </div>

        {/* Horizontal paged track (scroll-snap). Fixed height; pages instead of growing. */}
        <div
          ref={trackRef}
          onScroll={updateEdges}
          onMouseEnter={() => (pausedRef.current = true)}
          onMouseLeave={() => (pausedRef.current = false)}
          onTouchStart={() => (pausedRef.current = true)}
          onTouchEnd={() => (pausedRef.current = false)}
          className="-mx-2 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-2 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {sales.map((sale, i) => {
            const original =
              sale.originalPrice != null ? Number(sale.originalPrice) : null;
            const discounted =
              original != null
                ? Math.max(0, original * (1 - sale.discountPercent / 100))
                : null;
            return (
              <motion.article
                key={sale.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
                className="group relative flex min-h-[20rem] w-[85%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl text-white shadow-xl sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
              >
                {sale.image ? (
                  <img
                    src={sale.image}
                    alt={localizedValue(sale.title)}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-flamingo via-flamingo-dark to-tropical-orange" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

                <div className="relative z-10 flex items-start justify-between p-5">
                  <span className="rounded-full bg-flamingo px-3 py-1 text-sm font-bold shadow-lg">
                    -{sale.discountPercent}%
                  </span>
                  <span className="animate-float text-3xl">🔥</span>
                </div>

                <div className="relative z-10 p-5">
                  <h3 className="font-display text-2xl leading-tight tracking-wide sm:text-3xl">
                    {localizedValue(sale.title)}
                  </h3>
                  {localizedValue(sale.description) && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-white/75">
                      {localizedValue(sale.description)}
                    </p>
                  )}

                  {original != null && (
                    <div className="mt-3 flex items-center gap-2" dir="ltr">
                      <span className="text-sm text-white/50 line-through">
                        {original.toFixed(0)} {t("common.currency")}
                      </span>
                      <span className="text-2xl font-bold text-tropical-yellow">
                        {discounted.toFixed(0)} {t("common.currency")}
                      </span>
                    </div>
                  )}

                  <div className="mt-4">
                    <Countdown endsAt={sale.endsAt} labels={labels} />
                  </div>

                  <a
                    href="#contact"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
                  >
                    {t("flash.book_now")} <span aria-hidden>→</span>
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
