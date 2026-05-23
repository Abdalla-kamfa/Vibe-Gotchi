import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { loadLeaderboard, clearLeaderboard } from "../lib/leaderboard";
import { LeaderboardRow } from "../components/LeaderboardRow";

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const [entries, setEntries] = useState(() =>
    loadLeaderboard()
      .sort((a, b) => b.level - a.level)
      .slice(0, 20)
  );

  function handleClear() {
    clearLeaderboard();
    setEntries([]);
  }

  function handleRowClick(username: string) {
    setLocation(`/?u=${encodeURIComponent(username)}`);
  }

  return (
    <div className="relative min-h-screen bg-space flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 w-full max-w-lg"
      >
        <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors mb-4 block" data-testid="link-home">
          ← Back to VibeGotchi
        </Link>
        <h1
          className="font-pixel text-xl text-white animate-rainbow-glow"
          data-testid="text-leaderboard-title"
        >
          Leaderboard
        </h1>
        <p className="text-xs text-white/30 mt-2">Top pets summoned this session · click any row to view</p>
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
            <p className="text-sm text-white/50 text-center max-w-xs">
              Desolate in here. Your pet could be #1 by default. Embarrassing for everyone else.
            </p>
          </motion.div>
        ) : (
          entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.username}
              entry={entry}
              rank={i + 1}
              index={i}
              onClick={() => handleRowClick(entry.username)}
            />
          ))
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex flex-col items-center gap-4"
      >
        <Link href="/" data-testid="button-summon-own">
          <motion.span
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-black cursor-pointer btn-summon"
          >
            Summon your own
          </motion.span>
        </Link>

        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-white/20 hover:text-red-400/60 transition-colors"
          >
            Clear leaderboard
          </button>
        )}
      </motion.div>

      <footer className="mt-16 text-center flex flex-col gap-2">
        <p className="text-xs text-white/20 italic">No pets were harmed in the making of this app. Some developers were. 🐾</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="text-xs text-white/25 hover:text-white/50 transition-colors">Home</Link>
          <span className="text-white/15">·</span>
          <Link href="/leaderboard" className="text-xs text-white/25 hover:text-white/50 transition-colors">Leaderboard</Link>
          <span className="text-white/15">·</span>
          <Link href="/?battle=1" className="text-xs text-white/25 hover:text-white/50 transition-colors">Battle</Link>
        </div>
      </footer>
    </div>
  );
}
