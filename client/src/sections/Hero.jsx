import { motion } from "framer-motion";
import { useMemo } from "react";

function useGreeting() {
  return useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour ☀️";
    if (h < 18) return "Bon après-midi 🌴";
    return "Bonsoir 🌙";
  }, []);
}

export default function Hero({ config }) {
  const greeting = useGreeting();
  return (
    <section
      id="hero"
      className="relative h-screen flex items-center justify-center overflow-hidden"
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
        <div className="absolute inset-0 bg-gradient-to-br from-flamingo-dark via-tropical-orange to-tropical-yellow" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Animated blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-flamingo/20 rounded-full blur-3xl animate-blob" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-tropical-orange/20 rounded-full blur-3xl animate-blob"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-tropical-teal/10 rounded-full blur-3xl animate-blob"
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
          className="text-lg sm:text-xl text-white/60 font-light tracking-widest uppercase mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.8 }}
        >
          {greeting}
        </motion.p>

        <motion.h1
          className="font-display text-5xl sm:text-7xl md:text-[10rem] leading-none text-white tracking-wider"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1 }}
        >
          FLAMINGO
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl md:text-3xl text-white/80 mt-4 font-light"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.8 }}
        >
          {config.tagline || "Le paradis tropical qui prend vie"}
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
            Découvrir le Menu
          </a>
          <a
            href="#contact"
            className="px-8 py-4 border-2 border-white/40 hover:border-flamingo text-white rounded-full transition-all hover:scale-105 text-lg"
          >
            Nous Contacter
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
                🦩 FLAMINGO COCO BEACH • TROPICAL VIBES • BEACH BAR • GOOD TIMES
                • SUN & FUN 🦩
              </span>
            ))}
        </div>
      </div>
    </section>
  );
}
