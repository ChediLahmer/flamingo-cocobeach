import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

const MAX_PREVIEW = 4;

export default function MenuTeaser() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const { t, localizedValue } = useLanguage();

  useEffect(() => {
    fetch("/api/menu/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setActiveTab(data[0].id);
      });
  }, []);

  const activeCategory = categories.find((c) => c.id === activeTab);
  const previewItems = (activeCategory?.items || []).slice(0, MAX_PREVIEW);

  return (
    <section id="menu" className="py-32 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="text-flamingo font-semibold text-sm uppercase tracking-widest">
            {t("menu.subtitle")}
          </span>
          <h2 className="font-display text-5xl sm:text-6xl md:text-9xl text-gray-900 mt-4">
            {t("menu.title")}
          </h2>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          className="flex flex-wrap justify-center gap-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === cat.id
                  ? "bg-flamingo text-white scale-105"
                  : "bg-flamingo/10 text-gray-700 hover:bg-flamingo/20 hover:text-gray-900"
              }`}
            >
              {localizedValue(cat.name)}
            </button>
          ))}
        </motion.div>

        {/* Preview items */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {previewItems.map((item, i) => (
            <motion.div
              key={item.id}
              className="group flex gap-4 p-4 rounded-2xl bg-white/70 hover:bg-white transition-all border border-flamingo/10 hover:border-flamingo/30 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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
                  <span
                    className="text-flamingo font-bold whitespace-nowrap"
                    dir="ltr"
                  >
                    {Number(item.priceStandard).toFixed(0)}{" "}
                    {t("common.currency")}
                  </span>
                </div>
                {localizedValue(item.description) && (
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                    {localizedValue(item.description)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/carte"
            className="inline-block px-8 py-4 bg-flamingo text-white font-semibold rounded-full hover:bg-flamingo-dark transition-colors shadow-lg hover:shadow-flamingo/30"
          >
            {t("menu.view_all")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
