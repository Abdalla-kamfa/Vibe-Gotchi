import { motion } from "framer-motion";

interface StatBarProps {
  label: string;
  emoji: string;
  percent: number;
  color: string;
  delay?: number;
}

function StatBar({ label, emoji, percent, color, delay = 0 }: StatBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-[9px] text-white/60 tracking-wide">{emoji} {label}</span>
        <span className="text-xs text-white/50">{percent}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}88` }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.1, delay: 0.3 + delay * 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Shine sweep after fill */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)" }}
            initial={{ x: "-150%" }}
            animate={{ x: "250%" }}
            transition={{
              duration: 1.6,
              delay: 1.5 + delay * 0.2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 4,
            }}
          />
        </motion.div>
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
}: StatsPanelProps) {
  const levelColor = level >= 80 ? "#fbbf24" : level >= 50 ? "#c084fc" : "var(--neon-green)";
  const levelGlow  = level >= 80
    ? "0 0 14px rgba(251,191,36,0.65)"
    : level >= 50
    ? "0 0 12px rgba(192,132,252,0.55)"
    : undefined;

  const statCells = [
    { emoji: "🍕", label: "Fed",    value: `${commitCount30Days}c`, tint: "bg-green-500/[0.05]"  },
    { emoji: "🔥", label: "Streak", value: `${currentStreak}d`,     tint: "bg-orange-500/[0.05]" },
    { emoji: "🏆", label: "Level",  value: level.toString(),          tint: "bg-yellow-500/[0.05]" },
    { emoji: "⭐", label: "Stars",  value: totalStars >= 1000
        ? `${(totalStars / 1000).toFixed(1)}k`
        : totalStars.toString(),                                       tint: "bg-purple-500/[0.05]" },
  ];

  return (
    <motion.div
      data-testid="stats-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl glass p-4 sm:p-5 flex flex-col gap-3 sm:gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-pixel text-[10px] text-white/70 tracking-widest uppercase">Stats</h3>
        <span
          className="font-pixel text-sm"
          style={{ color: levelColor, textShadow: levelGlow }}
        >
          Lv.{level}
        </span>
      </div>

      {/* Health + Energy bars */}
      <div className="flex flex-col gap-3">
        <StatBar label="Health" emoji="❤️" percent={healthPercent} color="#ef4444" delay={0} />
        <StatBar label="Energy" emoji="⚡" percent={energyPercent} color="#eab308" delay={1} />
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {statCells.map(({ emoji, label, value, tint }) => (
          <div
            key={label}
            className={`rounded-xl border border-white/[0.06] p-2.5 sm:p-3 flex flex-col gap-1 min-h-[70px] justify-center ${tint}`}
          >
            <span className="font-pixel text-[7px] sm:text-[8px] text-white/50 tracking-wide">{emoji} {label}</span>
            <span className="text-sm sm:text-base font-semibold text-white/90">{value}</span>
          </div>
        ))}
      </div>

      {/* Vibe one-liner */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 sm:p-3 flex flex-col gap-1.5">
        <span className="font-pixel text-[8px] text-white/50 tracking-wide">💬 Vibe</span>
        <p className="text-sm leading-snug italic" style={{ color: "#7ec8a0" }}>
          <span className="not-italic text-lg leading-none" style={{ color: "#4ade80", opacity: 0.5 }}>"</span>
          {vibeOneLiner}
          <span className="not-italic text-lg leading-none" style={{ color: "#4ade80", opacity: 0.5 }}>"</span>
        </p>
        <span className="font-pixel text-[8px] text-[--neon-green] tracking-wide mt-0.5">{petPersonality}</span>
      </div>
    </motion.div>
  );
}
