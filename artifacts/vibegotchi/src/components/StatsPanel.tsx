import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StatBarProps {
  label: string;
  emoji: string;
  percent: number;
  color: string;
  delay?: number;
}

function StatBar({ label, emoji, percent, color, delay = 0 }: StatBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 80 + delay * 100);
    return () => clearTimeout(t);
  }, [percent, delay]);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-[9px] text-white/60 tracking-wide">{emoji} {label}</span>
        <span className="text-xs text-white/50">{percent}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${width}%`, transition: "width 0.8s ease-out" }}
        />
      </div>
    </div>
  );
}

interface StatsPanelProps {
  healthPercent: number;
  energyPercent: number;
  commitCount30Days: number;
  currentStreak: number;
  level: number;
  vibeOneLiner: string;
  petPersonality: string;
  totalStars: number;
  totalRepos: number;
}

export function StatsPanel({
  healthPercent,
  energyPercent,
  commitCount30Days,
  currentStreak,
  level,
  vibeOneLiner,
  petPersonality,
  totalStars,
  totalRepos,
}: StatsPanelProps) {
  return (
    <motion.div
      data-testid="stats-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-[10px] text-white/70 tracking-widest uppercase">Stats</h3>
        <span className="font-pixel text-[9px] text-[--neon-green] tracking-wide">Lv.{level}</span>
      </div>

      <div className="flex flex-col gap-3.5">
        <StatBar label="Health" emoji="❤️" percent={healthPercent} color="#ef4444" delay={0} />
        <StatBar label="Energy" emoji="⚡" percent={energyPercent} color="#eab308" delay={1} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {[
          { emoji: "🍕", label: "Fed", value: `${commitCount30Days} commits` },
          { emoji: "🔥", label: "Streak", value: `${currentStreak} days` },
          { emoji: "🏆", label: "Level", value: level.toString() },
          { emoji: "⭐", label: "Stars", value: totalStars.toLocaleString() },
        ].map(({ emoji, label, value }) => (
          <div
            key={label}
            className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col gap-1"
          >
            <span className="font-pixel text-[8px] text-white/50 tracking-wide">{emoji} {label}</span>
            <span className="text-sm font-semibold text-white/90">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col gap-1.5">
        <span className="font-pixel text-[8px] text-white/50 tracking-wide">💬 Vibe</span>
        <p className="text-sm text-white/80 leading-snug italic">"{vibeOneLiner}"</p>
        <span className="font-pixel text-[8px] text-[--neon-green] tracking-wide mt-0.5">{petPersonality}</span>
      </div>
    </motion.div>
  );
}
