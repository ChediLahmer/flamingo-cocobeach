import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const BATCH_SIZE = 20;

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  const loadImages = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: BATCH_SIZE });
        if (activeFilter) params.set("categoryId", activeFilter);
        if (!reset && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/gallery?${params}`);
        const data = await res.json();
        const newItems = data.items || [];

        if (reset) {
          setImages(newItems);
        } else {
          setImages((prev) => [...prev, ...newItems]);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } finally {
        setLoading(false);
      }
    },
    [activeFilter, cursor, loading],
  );

  useEffect(() => {
    fetch("/api/gallery/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    setImages([]);
    setCursor(null);
    setHasMore(true);
    const params = new URLSearchParams({ limit: BATCH_SIZE });
    if (activeFilter) params.set("categoryId", activeFilter);
    fetch(`/api/gallery?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setImages(data.items || []);
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      });
  }, [activeFilter]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadImages(false);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadImages]);

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
            GALERIE
          </h1>
          <p className="text-gray-600 mt-4 max-w-xl mx-auto">
            Revivez les meilleurs moments du Flamingo Coco Beach
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-5 py-2 rounded-full text-sm transition-all ${
              !activeFilter
                ? "bg-tropical-orange text-white"
                : "bg-tropical-orange/10 text-gray-700 hover:bg-tropical-orange/20"
            }`}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-5 py-2 rounded-full text-sm transition-all ${
                activeFilter === cat.id
                  ? "bg-tropical-orange text-white"
                  : "bg-tropical-orange/10 text-gray-700 hover:bg-tropical-orange/20"
              }`}
            >
              {cat.name.fr}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              className="break-inside-avoid cursor-pointer group"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.3 }}
              onClick={() => setLightbox(img)}
            >
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={img.url}
                  alt={img.alt || ""}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-flamingo/0 group-hover:bg-flamingo/20 transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sentinel for infinite scroll */}
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center mt-8">
            {loading && (
              <div className="w-8 h-8 border-2 border-flamingo border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}

        {!hasMore && images.length > 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Toutes les photos sont affichees
          </p>
        )}

        {!loading && images.length === 0 && (
          <p className="text-center text-gray-400 mt-8">
            Galerie vide pour le moment
          </p>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setLightbox(null)}
        >
          <motion.img
            src={lightbox.url}
            alt={lightbox.alt || ""}
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-white text-3xl hover:text-flamingo"
          >
            x
          </button>
        </motion.div>
      )}
    </div>
  );
}
