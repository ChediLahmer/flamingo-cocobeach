import { motion, useInView } from "framer-motion";
import SmartMedia from "../components/SmartMedia";
import { useRef, useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { API_BASE } from "../lib/api";

export default function Spaces() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [spaces, setSpaces] = useState([]);
  const { t, localizedValue } = useLanguage();

  useEffect(() => {
    fetch(`${API_BASE}/spaces`)
      .then((r) => r.json())
      .then((data) => setSpaces(data.items || []))
      .catch(() => {});
  }, []);

  return (
    <section id="spaces" className="py-32 relative overflow-hidden" ref={ref}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-flamingo/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="text-tropical-teal font-semibold text-sm uppercase tracking-widest">
            {t("spaces.subtitle")}
          </span>
          <h2 className="font-display text-6xl md:text-9xl text-gray-900 mt-4">
            {t("spaces.title")}
          </h2>
        </motion.div>

        {/* Spaces grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spaces.map((space, i) => (
            <motion.div
              key={space.id}
              className="group relative rounded-3xl overflow-hidden bg-white/80 border border-flamingo/10 hover:border-flamingo/40 transition-all shadow-sm"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              {/* Image */}
              <div className="h-56 overflow-hidden">
                {space.image ? (
                  <SmartMedia
                    src={space.image}
                    alt={localizedValue(space.name)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-tropical-teal/30 to-flamingo/30 flex items-center justify-center text-5xl">
                    🏖️
                  </div>
                )}
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-3xl text-white">
                  {localizedValue(space.name)}
                </h3>
                {localizedValue(space.description) && (
                  <p className="text-white/60 text-sm mt-2 line-clamp-2">
                    {localizedValue(space.description)}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-flamingo font-bold" dir="ltr">
                    {Number(space.price).toFixed(0)} {t("common.currency")}
                  </span>
                  <span className="text-white/40 text-sm">
                    · {space.capacity} {t("spaces.capacity")}
                  </span>
                </div>
              </div>

              {/* Status badge */}
              <div className="absolute top-4 end-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    space.available
                      ? "bg-tropical-green/80 text-white"
                      : "bg-red-500/80 text-white"
                  }`}
                >
                  {space.available
                    ? t("spaces.available")
                    : t("spaces.unavailable")}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
