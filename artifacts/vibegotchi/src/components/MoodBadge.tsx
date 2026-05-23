import { motion } from "framer-motion";
import { Flame, Zap, Clock, Activity, Skull } from "lucide-react";

interface MoodBadgeProps {
  emoji: string;
  label: string;
  tier: number;
}

const tierColors: Record<number, string> = {
  4: "bg-orange-500/20 border-orange-500/50 text-orange-300",
  3: "bg-green-500/20  border-green-500/50  text-green-300",
  2: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
  1: "bg-blue-500/20   border-blue-500/50   text-blue-300",
  0: "bg-red-500/20    border-red-500/50    text-red-300",
};

function MoodIcon({ tier }: { tier: number }) {
  const p = { size: 13, strokeWidth: 2 } as const;
  if (tier === 4) return <Flame    {...p} color="#ff6622" />;
  if (tier === 3) return <Zap      {...p} color="#aadd00" />;
  if (tier === 2) return <Clock    {...p} color="#ffaa00" />;
  if (tier === 1) return <Activity {...p} color="#6699cc" />;
  return               <Skull    {...p} color="#cc5555" />;
}

export function MoodBadge({ label, tier }: MoodBadgeProps) {
  const colorClass = tierColors[tier] ?? tierColors[0];
  const isOnFire   = tier === 4;

  return (
    <motion.div
      data-testid="mood-badge"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${colorClass}`}
      animate={isOnFire ? { scale: [1, 1.06, 1] } : {}}
      transition={isOnFire ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
    >
      <MoodIcon tier={tier} />
      <span>{label}</span>
    </motion.div>
  );
}
