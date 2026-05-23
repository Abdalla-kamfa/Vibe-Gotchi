import { motion } from "framer-motion";
import type { LeaderboardEntry } from "../lib/leaderboard";

const stageMeta: Record<string, { cls: string; label: string }> = {
  egg:    { cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",        label: "Egg"    },
  baby:   { cls: "bg-green-500/20 text-green-400 border-green-500/30",     label: "Baby"   },
  teen:   { cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",        label: "Teen"   },
  adult:  { cls: "bg-purple-500/20 text-purple-400 border-purple-500/30",  label: "Adult"  },
  legend: { cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 legend-badge-glow", label: "Legend" },
};

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-zinc-300",
  3: "text-orange-400",
};

const rankRowCls: Record<number, string> = {
  1: "rank-1-row",
  2: "rank-2-row",
  3: "rank-3-row",
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  index: number;
  onClick?: () => void;
}

export function LeaderboardRow({ entry, rank, index, onClick }: LeaderboardRowProps) {
  const meta    = stageMeta[entry.stage] ?? stageMeta.egg;
  const rankCls = rankColors[rank] ?? "text-white/40";
  const rowCls  = rankRowCls[rank] ?? "";
  const avatarSize = rank === 1 ? "w-11 h-11" : "w-9 h-9";
  const isTop3  = rank <= 3;

  return (
    <motion.div
      data-testid={`row-leaderboard-${index}`}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 }}
      whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(57,255,20,0.09)" }}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 transition-colors ${rowCls} ${onClick ? "cursor-pointer hover:bg-white/[0.06]" : ""}`}
    >
      <span className={`font-pixel text-xs w-7 shrink-0 ${rankCls}`}>
        {rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
      </span>

      <img
        src={`https://github.com/${entry.username}.png`}
        alt={entry.username}
        className={`${avatarSize} rounded-full border shrink-0 ${isTop3 ? "border-white/20" : "border-white/10"}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            `https://ui-avatars.com/api/?name=${entry.username}&background=1e1e2e&color=ffffff&size=64`;
        }}
      />

      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className={`font-semibold text-white truncate ${rank === 1 ? "text-base" : "text-sm"}`}>
          {entry.username}
        </span>
        {entry.petName && (
          <span className="font-pixel text-[7px] text-white/30 tracking-wide truncate">{entry.petName}</span>
        )}
        <span className="text-xs text-white/35 truncate">{entry.mood}</span>
      </div>

      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${meta.cls}`}>
        {meta.label}
      </span>

      <span className="font-pixel text-[9px] text-[--neon-green] shrink-0">Lv.{entry.level}</span>
    </motion.div>
  );
}
