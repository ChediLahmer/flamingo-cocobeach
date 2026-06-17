import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n/LanguageContext";
import { useUserAuth } from "../auth/UserAuthContext";
import { MenuPageSkeleton } from "../components/Skeleton";
import { API_BASE } from "../lib/api";

const ITEMS_PER_PAGE = 12;

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState(false);
  const { t, localizedValue } = useLanguage();
  const { isFavorite, toggleFavorite } = useUserAuth();

  useEffect(() => {
    fetch(`${API_BASE}/menu/categories`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setCategories(cats);
        const catParam = searchParams.get("cat");
        if (catParam && cats.find((c) => c.id === Number(catParam))) {
          setActiveTab(Number(catParam));
        } else if (cats.length > 0) {
          setActiveTab(cats[0].id);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const loadItems = useCallback(async (categoryId, p = 1) => {
    if (!categoryId) return;
    setItemsLoading(true);
    try {
      const params = new URLSearchParams({
        categoryId,
        page: p,
        limit: ITEMS_PER_PAGE,
      });
      const res = await fetch(`${API_BASE}/menu/items?${params}`);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || p);
    } catch {
      setError(true);
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab) loadItems(activeTab, 1);
  }, [activeTab, loadItems]);

  const changeTab = useCallback(
    (id) => {
      setActiveTab(id);
      setPage(1);
      setSearchParams({ cat: id });
    },
    [setSearchParams],
  );

  const goToPage = useCallback(
    (p) => {
      setPage(p);
      loadItems(activeTab, p);
    },
    [activeTab, loadItems],
  );

  return (
    <div className="relative min-h-screen overflow-hidden pt-24 pb-20">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            to="/"
            className="text-flamingo text-sm font-medium hover:underline"
          >
            {t("common.back")}
          </Link>
          <h1 className="font-display text-6xl md:text-8xl text-gray-900 mt-4">
            {t("menu.title")}
          </h1>
          <p className="text-gray-600 mt-4 max-w-xl mx-auto">
            {t("menu.subtitle")}
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => changeTab(cat.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === cat.id
                  ? "bg-flamingo text-white scale-105"
                  : "bg-flamingo/10 text-gray-700 hover:bg-flamingo/20"
              }`}
            >
              {localizedValue(cat.name)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && categories.length === 0 && !error && <MenuPageSkeleton />}

        {/* Items loading */}
        {!loading && itemsLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-2xl border border-gray-100"
              >
                <div className="w-20 h-20 rounded-xl bg-gray-200/80 flex-shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-3/4 rounded-full bg-gray-200/80" />
                  <div className="h-3 w-full rounded-full bg-gray-200/80" />
                  <div className="h-3 w-1/3 rounded-full bg-gray-200/80" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">{t("common.error_server")}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-flamingo text-white rounded-full text-sm font-medium hover:bg-flamingo-dark transition-colors"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {/* Items grid */}
        {!loading && !itemsLoading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="group flex gap-4 p-4 rounded-2xl bg-white/70 hover:bg-white transition-all border border-flamingo/10 hover:border-flamingo/30 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={localizedValue(item.name)}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 group-hover:text-flamingo transition-colors">
                      {localizedValue(item.name)}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="text-flamingo font-bold whitespace-nowrap"
                        dir="ltr"
                      >
                        {Number(item.priceStandard).toFixed(0)}{" "}
                        {t("common.currency")}
                      </span>
                      <button
                        onClick={() =>
                          toggleFavorite({
                            id: item.id,
                            name: item.name,
                            image: item.image,
                            priceStandard: item.priceStandard,
                          })
                        }
                        className={`transition-transform hover:scale-110 ${
                          isFavorite(item.id)
                            ? "text-flamingo"
                            : "text-gray-300 hover:text-flamingo"
                        }`}
                        aria-label={t("menu.save")}
                        title={t("menu.save")}
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill={isFavorite(item.id) ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {localizedValue(item.description) && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {localizedValue(item.description)}
                    </p>
                  )}
                  {!item.available && (
                    <span className="inline-block mt-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                      {t("common.unavailable")}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !itemsLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-flamingo/10 text-flamingo font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-flamingo/20 transition"
            >
              {t("common.previous")}
            </button>
            <span className="text-gray-600 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-flamingo/10 text-flamingo font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-flamingo/20 transition"
            >
              {t("common.next")}
            </button>
          </div>
        )}

        {!loading && !itemsLoading && items.length === 0 && activeTab && (
          <p className="text-center text-gray-400 mt-8">
            {t("common.no_items")}
          </p>
        )}
      </div>
    </div>
  );
}
