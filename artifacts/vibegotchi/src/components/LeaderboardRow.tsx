import { motion } from "framer-motion";
import type { LeaderboardEntry } from "../lib/leaderboard";

const stageColors: Record<string, string> = {
  egg: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  baby: "bg-green-500/20 text-green-400 border-green-500/30",
  teen: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  adult: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legend: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-zinc-300",
  3: "text-orange-400",
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  index: number;
}

export function LeaderboardRow({ entry, rank, index }: LeaderboardRowProps) {
  const stageCls = stageColors[entry.stage] ?? stageColors.egg;
  const rankCls = rankColors[rank] ?? "text-white/40";

  return (
    <motion.div
      data-testid={`row-leaderboard-${index}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
    >
      <span className={`font-pixel text-sm w-7 shrink-0 ${rankCls}`}>#{rank}</span>

      <img
        src={`https://github.com/${entry.username}.png`}
        alt={entry.username}
        className="w-9 h-9 rounded-full border border-white/10 shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${entry.username}&background=1e1e2e&color=ffffff&size=64`;
        }}
      />

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-sm font-medium text-white truncate">{entry.username}</span>
        <span className="text-xs text-white/40">{entry.mood}</span>
      </div>

      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${stageCls}`}>
        {entry.stage}
      </span>

      <span className="font-pixel text-[10px] text-[--neon-green] shrink-0">Lv.{entry.level}</span>
    </motion.div>
  );
}
