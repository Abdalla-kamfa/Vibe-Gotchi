import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { loadLeaderboard } from "../lib/leaderboard";
import { LeaderboardRow } from "../components/LeaderboardRow";

export default function Leaderboard() {
  const entries = useMemo(() => {
    return loadLeaderboard()
      .sort((a, b) => b.level - a.level)
      .slice(0, 10);
  }, []);

  return (
    <div className="min-h-screen bg-space flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 w-full max-w-lg"
      >
        <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors mb-4 block" data-testid="link-home">
          ← Back to VibeGotchi
        </Link>
        <h1
          className="font-pixel text-xl text-white"
          style={{ textShadow: "0 0 16px rgba(57,255,20,0.4)" }}
          data-testid="text-leaderboard-title"
        >
          Leaderboard
        </h1>
        <p className="text-xs text-white/30 mt-2">Top pets summoned this session</p>
      </motion.div>

      <div className="w-full max-w-lg flex flex-col gap-2">
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-16"
          >
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <ellipse cx="50" cy="60" rx="36" ry="32" fill="#1e1e2e" stroke="#333355" strokeWidth="2" />
              <circle cx="40" cy="57" r="5" fill="#444466" />
              <circle cx="60" cy="57" r="5" fill="#444466" />
              <path d="M38 72 Q50 68 62 72" stroke="#444466" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
            <p className="text-sm text-white/40 text-center">No pets summoned yet. Be the first.</p>
          </motion.div>
        ) : (
          entries.map((entry, i) => (
            <LeaderboardRow key={entry.username} entry={entry} rank={i + 1} index={i} />
          ))
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10"
      >
        <Link href="/" data-testid="button-summon-own">
          <motion.span
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-black cursor-pointer"
            style={{ backgroundColor: "var(--neon-green)" }}
          >
            Summon your own
          </motion.span>
        </Link>
      </motion.div>
    </div>
  );
}
