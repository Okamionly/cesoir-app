"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on first load per session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("cesoir-splash-shown")) return;
    setVisible(true);
    sessionStorage.setItem("cesoir-splash-shown", "1");

    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: "#000000" }}
        >
          {/* Gradient glow behind logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute"
            style={{
              width: 280,
              height: 280,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(0,255,136,0.1) 50%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          {/* Moon symbol */}
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              scale: [1, 1.08, 1],
            }}
            transition={{
              opacity: { duration: 0.5, ease: "easeOut" },
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            className="relative z-10"
            style={{
              fontSize: 72,
              color: "#8B5CF6",
              textShadow: "0 0 40px rgba(139,92,246,0.6)",
            }}
          >
            &#9790;
          </motion.span>

          {/* CeSoir text with blur reveal */}
          <motion.h1
            initial={{ opacity: 0, filter: "blur(20px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative z-10 mt-3 font-display text-3xl font-bold tracking-widest"
            style={{ color: "#FFFFFF" }}
          >
            CeSoir
          </motion.h1>

          {/* Progress bar */}
          <div
            className="absolute bottom-12 left-1/2 -translate-x-1/2 overflow-hidden rounded-full"
            style={{ width: 120, height: 3 }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
              className="h-full w-full origin-left rounded-full"
              style={{
                background: "linear-gradient(90deg, #8B5CF6, #00FF88)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
