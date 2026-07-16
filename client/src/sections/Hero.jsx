import { motion } from "framer-motion";
import { useMemo } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTimeTheme } from "../theme/useTimeTheme";
import TropicalBackground from "../components/TropicalBackground";

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "hero.greeting_morning";
  if (hour >= 12 && hour < 17) return "hero.greeting_afternoon";
  if (hour >= 17 && hour < 21) return "hero.greeting_evening";
  return "hero.greeting_night";
}

const HERO_GRADIENT = {
  morning: "from-sky-400 via-tropical-teal to-tropical-yellow",
  afternoon: "from-flamingo-dark via-tropical-orange to-tropical-yellow",
  evening: "from-flamingo-dark via-tropical-orange to-amber-300",
  night: "from-slate-950 via-indigo-950 to-slate-800",
};

export default function Hero({ config }) {
  const { t, localizedValue } = useLanguage();
  const { period, isNight } = useTimeTheme();
  const greeting = useMemo(() => t(getGreetingKey()), [t]);
  return (
    <section
      id="hero"
      className="relative h-[100svh] flex items-center justify-center overflow-hidden"
    >
      {/* Background video/image */}
      {config.hero_video_url ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={config.hero_poster_url}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={config.hero_video_url} type="video/mp4" />
        </video>
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${HERO_GRADIENT[period] || HERO_GRADIENT.afternoon}`}
        />
      )}

      {/* Overlay — deeper & cooler at night so the hero matches the theme */}
      <div
        className={`absolute inset-0 ${
          isNight
            ? "bg-gradient-to-b from-slate-950/70 via-indigo-950/55 to-slate-900/70"
            : "bg-black/50"
        }`}
      />

      {/* Tropical foliage */}
      <TropicalBackground variant="hero" />

      {/* Animated blobs */}
      <div
        className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-blob ${isNight ? "bg-indigo-400/15" : "bg-flamingo/20"}`}
      />
      <div
        className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-blob ${isNight ? "bg-sky-500/15" : "bg-tropical-orange/20"}`}
        style={{ animationDelay: "2s" }}
      />
      <div
        className={`absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl animate-blob ${isNight ? "bg-violet-500/10" : "bg-tropical-teal/10"}`}
        style={{ animationDelay: "4s" }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6, duration: 0.8, type: "spring" }}
          className="mb-6 text-6xl sm:text-7xl"
        >
          🦩
        </motion.div>

        <motion.p
          className="text-xl sm:text-2xl md:text-3xl text-white font-light mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.65, duration: 0.8 }}
        >
          {greeting}
        </motion.p>

        <motion.p
          className="text-lg sm:text-xl text-white/60 font-light tracking-widest uppercase mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.8 }}
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.h1
          className="font-display text-4xl sm:text-6xl md:text-8xl leading-none text-white tracking-wider"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }}
        >
          {localizedValue(config.name) || "FLAMINGO"}
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl md:text-3xl text-white/80 mt-4 font-light"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.8 }}
        >
          {localizedValue(config.tagline) || t("hero.subtitle")}
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 0.8 }}
        >
          <a
            href="#menu"
            className="px-8 py-4 bg-flamingo hover:bg-flamingo-dark text-white font-semibold rounded-full transition-all hover:scale-105 text-lg"
          >
            {t("hero.cta")}
          </a>
          <a
            href="#contact"
            className="px-8 py-4 border-2 border-white/40 hover:border-flamingo text-white rounded-full transition-all hover:scale-105 text-lg"
          >
            {t("hero.contact")}
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-flamingo rounded-full" />
        </div>
      </motion.div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 right-0 bg-flamingo py-3 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array(10)
            .fill(null)
            .map((_, i) => (
              <span
                key={i}
                className="mx-8 text-white font-bold text-sm uppercase tracking-widest"
              >
                🦩 {t("hero.marquee")} 🦩
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}
