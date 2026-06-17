import { motion } from "framer-motion";

export default function Loader() {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-sand flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated flamingo */}
      <motion.div
        className="text-7xl"
        animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🦩
      </motion.div>

      {/* Brand text */}
      <motion.h1
        className="font-display text-5xl mt-6 text-flamingo"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        FLAMINGO
      </motion.h1>

      {/* Loading bar */}
      <motion.div className="w-48 h-1 bg-flamingo/20 rounded-full mt-8 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-flamingo to-tropical-orange rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
