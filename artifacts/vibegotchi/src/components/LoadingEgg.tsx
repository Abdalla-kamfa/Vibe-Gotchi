import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Bribing GitHub for your data...",
  "Counting commits... this may take a while for some of you...",
  "Consulting the ancient git logs...",
  "Your pet is being summoned from the void...",
  "Checking if you actually committed anything...",
  "Scanning blame history... stay calm...",
];

export function LoadingEgg() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-10" data-testid="loading-egg">
      <motion.div
        className="relative"
        animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="75" rx="45" ry="58" fill="#1e1e2e" stroke="#444466" strokeWidth="2" />
          <path d="M50 40 L55 55 L48 65 L58 80" stroke="#6b6b9a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M70 45 L66 58 L72 68" stroke="#6b6b9a" strokeWidth="1.5" strokeLinecap="round" />
          <motion.g
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1 }}
            style={{ transformOrigin: "60px 75px" }}
          >
            <circle cx="46" cy="74" r="5" fill="#888899" />
            <circle cx="74" cy="74" r="5" fill="#888899" />
            <circle cx="44" cy="72" r="2" fill="#222233" />
            <circle cx="72" cy="72" r="2" fill="#222233" />
          </motion.g>
          <path d="M50 90 Q60 86 70 90" stroke="#888899" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <motion.ellipse
            cx="60" cy="75" rx="45" ry="58"
            fill="url(#shimmer)"
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <defs>
            <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {[0.9, 0.7, 0.8, 0.6].map((w, i) => (
          <motion.div
            key={i}
            className="h-3 rounded-full bg-white/5"
            style={{ width: `${w * 100}%` }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      <div className="h-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            className="text-sm text-white/50 text-center max-w-xs px-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
