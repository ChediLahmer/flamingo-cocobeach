import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const MAX_PREVIEW = 8;

export default function GalleryTeaser() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [images, setImages] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetch(`/api/gallery?limit=${MAX_PREVIEW}`)
      .then((r) => r.json())
      .then((d) => setImages(d.items || []));
  }, []);

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
            {t("gallery.subtitle")}
          </span>
          <h2 className="font-display text-5xl sm:text-6xl md:text-9xl text-gray-900 mt-4">
            {t("gallery.title")}
          </h2>
        </motion.div>

        {/* Preview grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={img.id}
              className="break-inside-avoid group"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.05, duration: 0.4 }}
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

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/galerie"
            className="inline-block px-8 py-4 bg-tropical-orange text-white font-semibold rounded-full hover:bg-tropical-orange/80 transition-colors shadow-lg"
          >
            {t("gallery.view_all")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
