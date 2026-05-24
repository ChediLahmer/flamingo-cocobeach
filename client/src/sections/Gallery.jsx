import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { API_BASE } from "../lib/api";

export default function Gallery() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/gallery/categories`)
      .then((r) => r.json())
      .then(setCategories);
    fetch(`${API_BASE}/gallery?limit=50`)
      .then((r) => r.json())
      .then((d) => setImages(d.items || []));
  }, []);

  useEffect(() => {
    const params = activeFilter
      ? `?categoryId=${activeFilter}&limit=50`
      : "?limit=50";
    fetch(`${API_BASE}/gallery${params}`)
      .then((r) => r.json())
      .then((d) => setImages(d.items || []));
  }, [activeFilter]);

  return (
    <section id="gallery" className="py-32 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="text-tropical-orange font-semibold text-sm uppercase tracking-widest">
            Moments Magiques
          </span>
          <h2 className="font-display text-6xl md:text-9xl text-gray-900 mt-4">
            GALERIE
          </h2>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
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
        </motion.div>

        {/* Masonry-like grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              className="break-inside-avoid cursor-pointer group"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.03, duration: 0.4 }}
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

        {images.length === 0 && (
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
            ✕
          </button>
        </motion.div>
      )}
    </section>
  );
}
