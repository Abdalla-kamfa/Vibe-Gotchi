import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900, delay = 0): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf: number;
    const tid = setTimeout(() => {
      const start = performance.now();
      function step(now: number) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(tid); cancelAnimationFrame(raf); };
  }, [target, duration, delay]);
  return count;
}

function useTypewriter(text: string, delayMs = 0): string {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let iid: ReturnType<typeof setInterval>;
    const charDelay = Math.max(18, Math.min(42, 1600 / Math.max(text.length, 1)));
    const tid = setTimeout(() => {
      let i = 0;
      iid = setInterval(() => {
        setDisplayed(text.slice(0, ++i));
        if (i >= text.length) clearInterval(iid);
      }, charDelay);
    }, delayMs);
    return () => { clearTimeout(tid); clearInterval(iid); };
  }, [text, delayMs]);
  return displayed;
}

function formatLastCommit(days: number): string {
  if (days === 0)   return "just now";
  if (days === 1)   return "yesterday";
  if (days < 7)    return `${days} days ago`;
  if (days < 14)   return "1 week ago";
  if (days < 30)   return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [vis, setVis] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <div
      className="relative cursor-default"
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
      onTouchStart={() => { timerRef.current = setTimeout(() => setVis(true), 500); }}
      onTouchEnd={() => { clearTimeout(timerRef.current); setTimeout(() => setVis(false), 1400); }}
    >
      {children}
      <AnimatePresence>
        {vis && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.94 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
            style={{
              background: "rgba(10,10,15,0.97)",
              border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 11,
              color: "#aaaaaa",
              maxWidth: 210,
              width: "max-content",
              textAlign: "center",
              lineHeight: 1.55,
              boxShadow: "0 8px 32px rgba(0,0,0,0.65)",
              whiteSpace: "normal",
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Corner reticles ───────────────────────────────────────────────────────────

const CORNER_CLASSES = [
  "top-0 left-0 border-t-2 border-l-2",
  "top-0 right-0 border-t-2 border-r-2",
  "bottom-0 left-0 border-b-2 border-l-2",
  "bottom-0 right-0 border-b-2 border-r-2",
];

function CornerAccents({ color, delay = 0 }: { color: string; delay?: number }) {
  return (
    <>
      {CORNER_CLASSES.map((cls, i) => (
        <motion.div
          key={i}
          className={`absolute w-4 h-4 sm:w-[18px] sm:h-[18px] pointer-events-none ${cls}`}
          style={{ borderColor: `${color}60` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, delay: delay + i * 0.06, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

// ── Health / Energy bars ──────────────────────────────────────────────────────

interface StatBarProps {
  label: "HEALTH" | "ENERGY";
  percent: number;
  delay?: number;
}

function StatBar({ label, percent, delay = 0 }: StatBarProps) {
  const isHealth = label === "HEALTH";

  const gradient = isHealth
    ? "linear-gradient(90deg, #cc1133 0%, #ff4422 40%, #ff7733 70%, #ffaa44 100%)"
    : "linear-gradient(90deg, #ddcc00 0%, #88ff00 100%)";

  const glowColor = isHealth ? "rgba(255,34,68,0.55)" : "rgba(136,255,0,0.5)";
  const showGlow  = isHealth ? percent >= 80 : percent >= 80;
  const isLow     = percent <= 20;
  const isDead    = percent === 0;

  const [flicker, setFlicker] = useState(false);
  useEffect(() => {
    if (!isHealth || !isLow || isDead) { setFlicker(false); return; }
    const id = setInterval(() => setFlicker(f => !f), 600 + Math.random() * 400);
    return () => clearInterval(id);
  }, [isHealth, isLow, isDead]);

  return (
    <Tooltip text={
      isHealth
        ? "Based on recency of last commit. Commits daily = full health."
        : "Ratio of this week's commits vs last week. More than last week = full energy."
    }>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isHealth ? (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.3, 1] }}
                style={{ display: "inline-block", opacity: flicker ? 0.45 : 1 }}
              >❤️</motion.span>
            ) : (
              <motion.span
                animate={{ opacity: [1, 0.55, 1, 0.8, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.2, 0.5, 0.7, 1] }}
                style={{ display: "inline-block" }}
              >⚡</motion.span>
            )}
            <span className="font-pixel text-[8px] text-white/60 tracking-wide">{label}</span>
          </div>
          <span className="text-xs font-semibold" style={{ color: isDead ? "#555" : isLow ? "#ff3333" : "rgba(255,255,255,0.55)" }}>
            {isDead && !isHealth ? "DEPLETED" : `${percent}%`}
          </span>
        </div>

        {!isHealth && percent === 0 ? (
          <div className="h-[8px] sm:h-[10px] rounded-full bg-white/[0.05] flex items-center justify-center">
            <span className="font-pixel text-[7px] text-red-500/60 tracking-widest">DEPLETED</span>
          </div>
        ) : (
          <div
            className="h-[8px] sm:h-[10px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)" }}
          >
            {!isDead && (
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: gradient,
                  boxShadow: showGlow ? `0 0 10px ${glowColor}` : undefined,
                  opacity: flicker ? 0.55 : 1,
                  transition: "opacity 0.15s",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1.2, delay: 0.5 + delay * 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)" }}
                  initial={{ x: "-150%" }}
                  animate={{ x: "250%" }}
                  transition={{ duration: 1.5, delay: 2 + delay * 0.18, ease: "easeInOut", repeat: Infinity, repeatDelay: 4.5 }}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Tooltip>
  );
}

// ── Last commit row ───────────────────────────────────────────────────────────

function LastCommitRow({ days, delay = 0 }: { days: number; delay?: number }) {
  const statuses = [
    { max: 1,  icon: "🟢", label: "Active",         color: "#22c55e" },
    { max: 3,  icon: "🟡", label: "Vibing",          color: "#eab308" },
    { max: 6,  icon: "🟠", label: "Getting rusty",   color: "#f97316" },
    { max: 13, icon: "🔴", label: "Concerning",      color: "#ef4444" },
    { max: Infinity, icon: "💀", label: "Critical",  color: "#991b1b" },
  ];
  const status = statuses.find(s => days <= s.max)!;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center gap-2 text-[11px] text-white/40"
    >
      <span className="shrink-0">📅</span>
      <span className="shrink-0 text-white/50">Last commit:</span>
      <span className="shrink-0 text-white/70 font-medium">{formatLastCommit(days)}</span>
      <div className="flex-1 h-px bg-white/[0.06] mx-1 hidden sm:block" />
      <span className="shrink-0 font-medium" style={{ color: status.color }}>
        {status.icon} {status.label}
      </span>
    </motion.div>
  );
}

// ── Stat cell ─────────────────────────────────────────────────────────────────

interface StatCellProps {
  emoji: string;
  label: string;
  value: number;
  unit: string;
  accentColor: string;
  bgTint: string;
  bottomColor: string;
  bottomPercent: number;
  tooltip: string;
  delay?: number;
  special?: "dead" | "broken" | "gold" | "spark" | null;
}

function StatCell({ emoji, label, value, unit, accentColor, bgTint, bottomColor, bottomPercent, tooltip, delay = 0, special }: StatCellProps) {
  const displayVal = useCountUp(value, 900, 300 + delay * 100);
  const [hovered, setHovered] = useState(false);

  const displayEmoji = special === "dead" ? "💀" : emoji;

  return (
    <Tooltip text={tooltip}>
      <motion.div
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.5 + delay * 0.1, ease: [0.22, 1, 0.36, 1] }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="rounded-2xl border flex flex-col gap-1 min-h-[80px] sm:min-h-[90px] overflow-hidden relative"
        style={{
          background: hovered ? `${bgTint}, rgba(255,255,255,0.04)` : `${bgTint}, rgba(255,255,255,0.02)`,
          borderColor: hovered ? `${accentColor}33` : "rgba(255,255,255,0.05)",
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.3)" : "none",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          transition: "all 200ms ease",
          padding: "14px 14px 0",
        }}
      >
        <div className="flex items-start justify-between">
          <motion.span
            className="text-lg sm:text-xl leading-none"
            animate={
              label === "Streak" ? { opacity: [1, 0.5, 1] } :
              label === "Stars"  ? { scale: [1, 1.18, 1] }  : {}
            }
            transition={
              label === "Streak" ? { duration: 1.4, repeat: Infinity } :
              label === "Stars"  ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : {}
            }
          >{displayEmoji}</motion.span>
          <span className="font-pixel text-[7px] tracking-wide" style={{ color: `${accentColor}bb` }}>{label.toUpperCase()}</span>
        </div>

        <div className="flex-1 flex items-end pb-2 gap-1">
          <span className="text-[20px] sm:text-[24px] font-black text-white/90 leading-none tabular-nums">
            {displayVal >= 1000 ? `${(displayVal / 1000).toFixed(1)}k` : displayVal}
          </span>
          <span className="text-[11px] text-white/35 mb-0.5">{unit}</span>
        </div>

        {special === "broken" && (
          <span className="font-pixel text-[6px] text-red-500/70 pb-1.5 tracking-widest">BROKEN</span>
        )}

        {/* Bottom progress bar */}
        <div className="h-[3px] w-full bg-white/[0.04] absolute bottom-0 left-0 right-0">
          <motion.div
            className="h-full"
            style={{ background: bottomColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(bottomPercent * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.8 + delay * 0.1, ease: "easeOut" }}
          />
        </div>

        {special === "dead" && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 0 2px rgba(239,68,68,0.35)", "0 0 0 0 rgba(239,68,68,0)"] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        )}
      </motion.div>
    </Tooltip>
  );
}

// ── Vibe section ──────────────────────────────────────────────────────────────

function VibeSection({ oneLiner, personality, isAI, delay = 0 }: { oneLiner: string; personality: string; isAI?: boolean; delay?: number }) {
  const typed = useTypewriter(oneLiner, delay * 1000 + 200);
  return (
    <Tooltip text="AI analysis of your last 5 commit messages. What do they reveal about you?">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay }}
        className="w-full rounded-r-2xl"
        style={{
          background: "rgba(0,255,136,0.03)",
          border: "1px solid rgba(0,255,136,0.1)",
          borderLeft: "3px solid rgba(0,255,136,0.55)",
          padding: "14px 18px",
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-pixel text-[7px] text-[--neon-green]/60 tracking-widest">💬 VIBE</span>
          <span className="text-[10px] text-white/30">
            {isAI ? "✨ analyzed by AI" : "⚙️ rule-based"}
          </span>
        </div>
        <p className="text-[13px] sm:text-sm leading-relaxed italic" style={{ color: "#b8e8cc" }}>
          <span className="not-italic text-2xl leading-none" style={{ color: "rgba(0,255,136,0.35)", verticalAlign: "-4px" }}>&ldquo;</span>
          {typed}
          {typed.length < oneLiner.length && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-3 bg-[--neon-green]/60 ml-0.5 align-middle"
            />
          )}
          <span className="not-italic text-2xl leading-none" style={{ color: "rgba(0,255,136,0.35)", verticalAlign: "-4px" }}>&rdquo;</span>
        </p>
        <p className="font-pixel text-[7px] text-[--neon-green]/70 tracking-wide mt-2.5">{personality}</p>
      </motion.div>
    </Tooltip>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

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
  accentColor: string;
  daysSinceLastCommit: number;
  vibeIsAI?: boolean;
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
  accentColor,
  daysSinceLastCommit,
  vibeIsAI = false,
}: StatsPanelProps) {
  const levelColor =
    level >= 81  ? "#ffaa00" :
    level >= 51  ? "#aa44ff" :
    level >= 31  ? "#0088ff" :
    level >= 11  ? "#00ff88" :
    "#888888";

  const levelGlow = level >= 81 ? `0 0 14px rgba(255,170,0,0.7)` : level >= 51 ? `0 0 12px rgba(170,68,255,0.55)` : undefined;

  const fedPercent   = Math.min(commitCount30Days / 30, 1);
  const streakPct    = Math.min(currentStreak / 7, 1);
  const levelPct     = Math.min((level % 10) / 10, 1);
  const starsPct     = Math.min(Math.log10(totalStars + 1) / 4, 1);

  const statCells: StatCellProps[] = [
    {
      emoji: "🍕", label: "Fed",    value: commitCount30Days,
      unit: "commits",  accentColor: "#ff8800",
      bgTint: "rgba(255,136,0,0.04)",
      bottomColor: "#ff8800", bottomPercent: fedPercent,
      tooltip: "Total commits in the last 30 days. Commits are food for your pet.",
      special: commitCount30Days === 0 ? "dead" : null,
    },
    {
      emoji: "🔥", label: "Streak", value: currentStreak,
      unit: "days",     accentColor: "#ff4400",
      bgTint: "rgba(255,68,0,0.04)",
      bottomColor: "#ff4400", bottomPercent: streakPct,
      tooltip: "Consecutive days with at least one commit. Don't break the chain.",
      special: currentStreak === 0 ? "broken" : null,
    },
    {
      emoji: "🏆", label: "Level",  value: level,
      unit: "",         accentColor: "#ffaa00",
      bgTint: "rgba(255,170,0,0.04)",
      bottomColor: levelColor, bottomPercent: levelPct,
      tooltip: "Calculated from total public repos and stars. Grow your portfolio.",
      special: level >= 50 ? "gold" : null,
    },
    {
      emoji: "⭐", label: "Stars",  value: totalStars,
      unit: "total",    accentColor: "#0088ff",
      bgTint: "rgba(0,136,255,0.04)",
      bottomColor: "#0088ff", bottomPercent: starsPct,
      tooltip: "Total stars across all public repositories. Community recognition.",
      special: totalStars >= 100 ? "spark" : null,
    },
  ];

  return (
    <motion.div
      data-testid="stats-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative rounded-3xl overflow-hidden flex flex-col gap-4 p-4 sm:p-6"
      style={{
        background: `linear-gradient(135deg, rgba(0,255,136,0.03) 0%, rgba(0,0,0,0) 50%, rgba(120,0,255,0.03) 100%)`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundImage: `
          linear-gradient(135deg, rgba(0,255,136,0.03) 0%, rgba(0,0,0,0) 50%, rgba(120,0,255,0.03) 100%),
          linear-gradient(rgba(0,255,136,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.018) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 20px 20px, 20px 20px",
      }}
    >
      <CornerAccents color={accentColor} delay={0.3} />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="font-pixel text-[10px] tracking-widest" style={{ color: "rgba(0,255,136,0.5)" }}>STATS</span>
          <div className="relative h-[2px] w-20 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div
              className="absolute top-0 left-0 h-full w-6 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.7), transparent)" }}
              animate={{ x: ["-24px", "80px"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 0.8 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {level >= 50 && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-xs"
            >▲</motion.span>
          )}
          <motion.span
            className="font-pixel text-[20px] sm:text-[26px] leading-none"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
            style={{ color: levelColor, textShadow: levelGlow }}
          >
            Lv.{level}
          </motion.span>
        </div>
      </motion.div>

      {/* ── Bars ── */}
      <div className="flex flex-col gap-4">
        <StatBar label="HEALTH" percent={healthPercent} delay={0} />
        <StatBar label="ENERGY" percent={energyPercent} delay={1} />
      </div>

      {/* ── Last commit ── */}
      <LastCommitRow days={daysSinceLastCommit} delay={0.9} />

      {/* ── Stat grid ── */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {statCells.map((cell, i) => (
          <StatCell key={cell.label} {...cell} delay={i} />
        ))}
      </div>

      {/* ── Vibe ── */}
      <VibeSection oneLiner={vibeOneLiner} personality={petPersonality} isAI={vibeIsAI} delay={1.2} />
    </motion.div>
  );
}
