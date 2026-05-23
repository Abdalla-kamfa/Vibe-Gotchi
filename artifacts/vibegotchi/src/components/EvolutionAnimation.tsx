import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PetStage } from "../lib/petLogic";

type EvoPhase = "egg" | "crack" | "flash" | "done";

interface EvolutionAnimationProps {
  stage: PetStage;
  colors: { fill: string; accent: string };
  onComplete: () => void;
}

export function EvolutionAnimation({ colors, onComplete }: EvolutionAnimationProps) {
  const [phase, setPhase] = useState<EvoPhase>("egg");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("crack"), 550);
    const t2 = setTimeout(() => setPhase("flash"), 1050);
    const t3 = setTimeout(() => setPhase("done"), 1350);
    const t4 = setTimeout(() => onComplete(), 1550);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-4 relative" style={{ minHeight: 300 }}>
      <AnimatePresence>
        {/* Flash overlay */}
        {phase === "flash" && (
          <motion.div
            key="flash"
            className="absolute inset-0 z-20 rounded-2xl"
            style={{ background: `radial-gradient(circle, ${colors.accent}99 0%, transparent 70%)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Egg shaking + cracking */}
      {(phase === "egg" || phase === "crack") && (
        <motion.div
          animate={
            phase === "crack"
              ? { rotate: [-8, 8, -6, 6, -4, 4, 0], scale: [1, 1.08, 0.95, 1.1, 0.97, 1.05, 1] }
              : { rotate: [-2, 2, -2], scale: [1, 1.02, 1] }
          }
          transition={{ duration: phase === "crack" ? 0.5 : 0.6, repeat: phase === "egg" ? Infinity : 0 }}
        >
          <svg width="200" height="230" viewBox="0 0 120 140" fill="none">
            <ellipse cx="60" cy="75" rx="48" ry="62" fill={colors.fill} opacity="0.25" />
            <ellipse cx="60" cy="73" rx="44" ry="58" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />

            {/* Crack lines — more intense during crack phase */}
            <motion.path
              d="M48 38 L53 55 L45 66 L56 82"
              stroke={colors.accent} strokeWidth={phase === "crack" ? 2.5 : 1.5}
              strokeLinecap="round" opacity={phase === "crack" ? 1 : 0.6}
            />
            <motion.path
              d="M70 43 L65 58 L73 70"
              stroke={colors.accent} strokeWidth={phase === "crack" ? 2.5 : 1.5}
              strokeLinecap="round" opacity={phase === "crack" ? 1 : 0.6}
            />
            {phase === "crack" && (
              <>
                <path d="M55 82 L50 95 L60 100" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
                <path d="M65 70 L72 84 L67 92" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" opacity="0.9" />
              </>
            )}

            {/* Eyes */}
            <motion.g
              animate={{ scaleY: phase === "crack" ? [1, 0.05, 1] : [1, 0.1, 1] }}
              transition={{ duration: phase === "crack" ? 0.2 : 3, repeat: Infinity, repeatDelay: phase === "crack" ? 0.1 : 1.5 }}
              style={{ transformOrigin: "60px 74px" }}
            >
              <circle cx="46" cy="73" r="6" fill="#1a1a2e" />
              <circle cx="74" cy="73" r="6" fill="#1a1a2e" />
              <circle cx="43" cy="70" r="2.5" fill="white" opacity="0.7" />
              <circle cx="71" cy="70" r="2.5" fill="white" opacity="0.7" />
            </motion.g>

            {/* Glow on crack phase */}
            {phase === "crack" && (
              <motion.ellipse
                cx="60" cy="73" rx="44" ry="58"
                fill="none"
                stroke={colors.accent}
                strokeWidth="4"
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 0.25, repeat: Infinity }}
              />
            )}
          </svg>
        </motion.div>
      )}

      {/* Loading text */}
      <motion.p
        className="font-pixel text-[9px] tracking-widest mt-4"
        style={{ color: colors.accent }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      >
        {phase === "egg" && "EVOLVING..."}
        {phase === "crack" && "CRACKING..."}
        {(phase === "flash" || phase === "done") && "UNLEASHED!"}
      </motion.p>
    </div>
  );
}
