import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";

const ITEMS_PER_PAGE = 6;

export default function SpacesPage() {
  const [spaces, setSpaces] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { t, localizedValue } = useLanguage();

  const loadSpaces = useCallback(async (p = 1) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/spaces?page=${p}&limit=${ITEMS_PER_PAGE}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setSpaces(data.items || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || p);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpaces(1);
  }, [loadSpaces]);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            to="/"
            className="text-flamingo text-sm font-medium hover:underline"
          >
            {t("common.back")}
          </Link>
          <h1 className="font-display text-6xl md:text-8xl text-gray-900 mt-4">
            {t("spaces.title")}
          </h1>
          <p className="text-gray-600 mt-4 max-w-xl mx-auto">
            {t("spaces.subtitle")}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {spaces.map((space, i) => (
            <motion.div
              key={space.id}
              className="group relative rounded-3xl overflow-hidden bg-white/80 border border-flamingo/10 hover:border-flamingo/40 transition-all shadow-sm"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
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
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">
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

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center mt-8">
            <div className="w-8 h-8 border-2 border-flamingo border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">{t("common.error_server")}</p>
            <button
              onClick={() => loadSpaces(1)}
              className="px-5 py-2 bg-flamingo text-white rounded-full text-sm font-medium hover:bg-flamingo-dark transition-colors"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => loadSpaces(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-flamingo/10 text-flamingo font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-flamingo/20 transition"
            >
              {t("common.previous")}
            </button>
            <span className="text-gray-600 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => loadSpaces(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-flamingo/10 text-flamingo font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-flamingo/20 transition"
            >
              {t("common.next")}
            </button>
          </div>
        )}

        {!loading && spaces.length === 0 && (
          <p className="text-center text-gray-400 mt-8">
            {t("spaces.no_results")}
          </p>
        )}
      </div>
    </div>
  );
}
