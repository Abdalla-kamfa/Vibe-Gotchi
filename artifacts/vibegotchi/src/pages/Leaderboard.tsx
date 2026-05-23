import { useState, useEffect } from "react";
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

  useEffect(() => {
    document.title = "Hall of Legends — VibeGotchi 🐾";
    return () => { document.title = "VibeGotchi 🐾"; };
  }, []);

  function handleClear() {
    clearLeaderboard();
    setEntries([]);
  }

  function handleRowClick(username: string) {
    setLocation(`/?u=${encodeURIComponent(username)}`);
  }

  return (
    <div className="relative min-h-screen bg-space flex flex-col items-center overflow-x-hidden px-4 py-8">

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="self-start mb-6 max-w-lg w-full mx-auto"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          data-testid="link-home"
        >
          ← Back to VibeGotchi
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 w-full max-w-lg"
      >
        <div className="flex items-center justify-center gap-3 relative">
          <h1
            className="font-pixel text-xl"
            style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3)" }}
            data-testid="text-leaderboard-title"
          >
            Hall of Legends
          </h1>

          {/* LIVE indicator */}
          <motion.div
            className="absolute -right-2 top-0 flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span className="text-[10px] text-red-400/80 font-semibold tracking-wider">LIVE</span>
          </motion.div>
        </div>

        <p className="text-xs text-white/25 mt-3">
          Top pets summoned this session · click any row to summon
        </p>
      </motion.div>

      {/* Rows */}
      <div className="w-full max-w-lg flex flex-col gap-2">
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl"
            >
              😔
            </motion.div>
            <p className="text-sm text-white/50 text-center max-w-[260px] leading-relaxed">
              No pets summoned yet.{" "}
              <span className="text-white/70">You could be #1 by default.</span>
              {" "}Embarrassing for everyone else.
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

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex flex-col items-center gap-4"
      >
        <Link href="/" data-testid="button-summon-own">
          <motion.span
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl font-semibold text-sm text-black cursor-pointer btn-summon"
          >
            Summon your own ✨
          </motion.span>
        </Link>

        {entries.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-white/15 hover:text-red-400/60 transition-colors"
          >
            Clear leaderboard
          </button>
        )}
      </motion.div>

      {/* Footer */}
      <footer className="mt-16 w-full max-w-lg border-t pt-6 text-center flex flex-col gap-2" style={{ borderColor: "rgba(57,255,20,0.1)" }}>
        <p className="text-xs text-white/20 italic">No pets were harmed in the making of this app. Some developers were. 🐾</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="text-xs text-white/20 hover:text-white/50 transition-colors">Home</Link>
          <span className="text-white/10">·</span>
          <Link href="/leaderboard" className="text-xs text-white/25 hover:text-white/50 transition-colors">Leaderboard</Link>
          <span className="text-white/10">·</span>
          <Link href="/?battle=1" className="text-xs text-white/20 hover:text-white/50 transition-colors">Battle</Link>
        </div>
      </footer>
    </div>
  );
}
