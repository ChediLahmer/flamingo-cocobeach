import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export default function About({ config }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 relative overflow-hidden" ref={ref}>
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-flamingo/5 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-flamingo font-semibold text-sm uppercase tracking-widest">
              Notre histoire
            </span>
            <h2 className="font-display text-5xl sm:text-6xl md:text-8xl text-gray-900 mt-4 leading-none">
              BIENVENUE AU
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-flamingo to-tropical-orange">
                PARADIS
              </span>
            </h2>
            <p className="text-gray-600 text-lg mt-8 leading-relaxed max-w-lg">
              {config.description ||
                "Un lieu unique où la plage rencontre la fête. Des cocktails tropicaux, une cuisine savoureuse et une ambiance électrique qui vous transportera sous les tropiques."}
            </p>

            <div className="flex gap-8 mt-12">
              <div>
                <div className="font-display text-4xl text-flamingo">∞</div>
                <div className="text-gray-500 text-sm mt-1">Bonnes Vibes</div>
              </div>
              <div>
                <div className="font-display text-4xl text-tropical-orange">
                  365
                </div>
                <div className="text-gray-500 text-sm mt-1">Jours / An</div>
              </div>
              <div>
                <div className="font-display text-4xl text-tropical-teal">
                  100%
                </div>
                <div className="text-gray-500 text-sm mt-1">Tropical</div>
              </div>
            </div>
          </motion.div>

          {/* Images */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative z-10">
              {config.about_image_1 ? (
                <img
                  src={config.about_image_1}
                  alt="Flamingo Coco Beach"
                  className="rounded-3xl w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-flamingo/30 to-tropical-orange/30 flex items-center justify-center text-7xl">
                  🏖️
                </div>
              )}
            </div>

            {/* Floating accent image */}
            <div className="absolute -bottom-8 -left-8 w-32 h-32 sm:w-48 sm:h-48 z-20 animate-float hidden sm:block">
              {config.about_image_2 ? (
                <img
                  src={config.about_image_2}
                  alt=""
                  className="w-full h-full rounded-2xl object-cover shadow-2xl border-4 border-sand"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-tropical-teal to-tropical-green shadow-2xl border-4 border-sand flex items-center justify-center text-4xl">
                  🍹
                </div>
              )}
            </div>

            {/* Decorative circle */}
            <div className="absolute -top-6 -right-6 w-24 h-24 border-2 border-flamingo/30 rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
