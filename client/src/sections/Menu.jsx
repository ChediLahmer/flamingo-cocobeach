import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function Menu() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    fetch("/api/menu/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setActiveTab(data[0].id);
      });
  }, []);

  const activeCategory = categories.find((c) => c.id === activeTab);

  return (
    <section id="menu" className="py-32 relative" ref={ref}>
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="text-flamingo font-semibold text-sm uppercase tracking-widest">
            Saveurs Tropicales
          </span>
          <h2 className="font-display text-6xl md:text-9xl text-gray-900 mt-4">
            NOTRE CARTE
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
              {cat.name.fr}
            </button>
          ))}
        </motion.div>

        {/* Menu items */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {activeCategory?.items?.map((item, i) => (
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
                  alt={item.name.fr}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
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
              </div>
            </motion.div>
          ))}
        </motion.div>

        {activeCategory?.items?.length === 0 && (
          <p className="text-center text-gray-400 mt-8">
            Aucun article dans cette catégorie
          </p>
        )}
      </div>
    </section>
  );
}
