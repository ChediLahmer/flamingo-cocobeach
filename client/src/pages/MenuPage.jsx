import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";

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

  useEffect(() => {
    fetch("/api/menu/categories")
      .then((r) => r.json())
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
      const res = await fetch(`/api/menu/items?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || p);
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
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            to="/"
            className="text-flamingo text-sm font-medium hover:underline"
          >
            Retour
          </Link>
          <h1 className="font-display text-6xl md:text-8xl text-gray-900 mt-4">
            NOTRE CARTE
          </h1>
          <p className="text-gray-600 mt-4 max-w-xl mx-auto">
            Saveurs tropicales, cocktails signatures et plats faits maison
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
              {cat.name.fr}
            </button>
          ))}
        </div>

        {/* Loading */}
        {(loading || itemsLoading) && (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-flamingo border-t-transparent rounded-full animate-spin" />
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
                    alt={item.name.fr}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 group-hover:text-flamingo transition-colors">
                      {item.name.fr}
                    </h3>
                    <span className="text-flamingo font-bold whitespace-nowrap">
                      {Number(item.priceStandard).toFixed(0)} DT
                    </span>
                  </div>
                  {item.description?.fr && (
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                      {item.description.fr}
                    </p>
                  )}
                  {!item.available && (
                    <span className="inline-block mt-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                      Indisponible
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
              Precedent
            </button>
            <span className="text-gray-600 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-flamingo/10 text-flamingo font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-flamingo/20 transition"
            >
              Suivant
            </button>
          </div>
        )}

        {!loading && !itemsLoading && items.length === 0 && activeTab && (
          <p className="text-center text-gray-400 mt-8">
            Aucun article dans cette categorie
          </p>
        )}
      </div>
    </div>
  );
}
