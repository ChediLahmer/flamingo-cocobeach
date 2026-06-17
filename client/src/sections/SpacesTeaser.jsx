import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { SpacesTeaserSkeleton } from "../components/Skeleton";
import { API_BASE } from "../lib/api";

const MAX_PREVIEW = 3;

const VP = { once: true, margin: "-50px" };

export default function SpacesTeaser() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t, localizedValue } = useLanguage();

  useEffect(() => {
    fetch(`${API_BASE}/spaces?limit=${MAX_PREVIEW}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => setSpaces(data.items || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-32 relative overflow-hidden">
        <SpacesTeaserSkeleton />
      </section>
    );
  }

  if (error || spaces.length === 0) return null;

  return (
    <section id="spaces" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-flamingo/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.7 }}
        >
          <span className="text-tropical-teal font-semibold text-sm uppercase tracking-widest">
            {t("spaces.subtitle")}
          </span>
          <h2 className="font-display text-5xl sm:text-6xl md:text-9xl text-gray-900 mt-4">
            {t("spaces.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spaces.map((space, i) => (
            <motion.div
              key={space.id}
              className="group relative rounded-3xl overflow-hidden bg-white/80 border border-flamingo/10 hover:border-flamingo/40 transition-all shadow-sm"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              whileHover={{ y: -8 }}
            >
              <div className="h-56 overflow-hidden">
                {space.image ? (
                  <img
                    src={space.image}
                    alt={localizedValue(space.name)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-tropical-teal/30 to-flamingo/30 flex items-center justify-center text-5xl">
                    🏖️
                  </div>
                )}
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

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
                    {space.capacity} {t("spaces.capacity")}
                  </span>
                </div>
              </div>

              <div className="absolute top-4 right-4">
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

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VP}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/espaces"
            className="inline-block px-8 py-4 bg-tropical-teal text-white font-semibold rounded-full hover:bg-tropical-teal/80 transition-colors shadow-lg"
          >
            {t("spaces.view_all")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
