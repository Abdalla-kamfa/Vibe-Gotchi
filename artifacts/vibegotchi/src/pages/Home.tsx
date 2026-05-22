import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { fetchGitHubPetData, type GitHubPetData } from "../lib/github";
import { getPetStage, getPetColors, getMood, getLevel, getAccessories, getHealthPercent, getEnergyPercent } from "../lib/petLogic";
import { analyzeVibe } from "../lib/openai";
import { saveToLeaderboard } from "../lib/leaderboard";
import { PetSprite } from "../components/PetSprite";
import { StatsPanel } from "../components/StatsPanel";
import { MoodBadge } from "../components/MoodBadge";
import { ShareButton } from "../components/ShareButton";
import { LoadingEgg } from "../components/LoadingEgg";
import type { VibeResult } from "@workspace/api-client-react";

type Phase = "input" | "loading" | "result" | "error";

interface ErrorState {
  type: "not_found" | "rate_limited" | "generic";
  message: string;
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [username, setUsername] = useState("");
  const [petData, setPetData] = useState<GitHubPetData | null>(null);
  const [vibeResult, setVibeResult] = useState<VibeResult | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);

  async function handleSummon(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setPhase("loading");
    setError(null);

    try {
      const data = await fetchGitHubPetData(trimmed);
      setPetData(data);

      const vibe = await analyzeVibe(
        data.recentCommitMessages,
        data.topLanguage,
        data.commitCount30Days,
        data.daysSinceLastCommit
      );
      setVibeResult(vibe);

      const stage = getPetStage(data.commitCount30Days);
      const level = getLevel(data.totalRepos, data.totalStars);
      const mood = getMood(data.daysSinceLastCommit, vibe.moodBoost as "positive" | "neutral" | "negative");

      saveToLeaderboard({
        username: data.username,
        stage,
        level,
        mood: `${mood.emoji} ${mood.label}`,
        timestamp: Date.now(),
      });

      setPhase("result");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "GENERIC";
      if (msg === "USER_NOT_FOUND") {
        setError({ type: "not_found", message: "This username doesn't exist... or they deleted everything out of shame." });
      } else if (msg === "RATE_LIMITED") {
        setError({ type: "rate_limited", message: "GitHub is being shy. Try again in a moment." });
      } else {
        setError({ type: "generic", message: "Something went wrong. Try again." });
      }
      setPhase("error");
    }
  }

  function handleReset() {
    setPhase("input");
    setPetData(null);
    setVibeResult(null);
    setError(null);
  }

  const stage = petData ? getPetStage(petData.commitCount30Days) : "egg";
  const colors = petData ? getPetColors(petData.topLanguage) : { fill: "#22c55e", accent: "#86efac" };
  const accessories = petData ? getAccessories(petData.topLanguage, petData.totalStars, petData.daysSinceLastCommit, petData.commitCount30Days) : [];
  const mood = petData ? getMood(petData.daysSinceLastCommit, vibeResult?.moodBoost as "positive" | "neutral" | "negative" | undefined) : null;
  const level = petData ? getLevel(petData.totalRepos, petData.totalStars) : 0;
  const healthPercent = petData ? getHealthPercent(petData.daysSinceLastCommit) : 0;
  const energyPercent = petData ? getEnergyPercent(
    petData.commitCount30Days > 0 ? Math.ceil(petData.commitCount30Days * 0.4) : 0,
    petData.commitCount30Days > 0 ? Math.ceil(petData.commitCount30Days * 0.3) : 0
  ) : 0;

  return (
    <div className="min-h-screen bg-space flex flex-col items-center px-4 py-8">
      {/* Header always visible */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 w-full max-w-lg"
      >
        <h1
          className="font-pixel text-2xl sm:text-3xl text-white mb-3"
          style={{ textShadow: "0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(147,51,234,0.3)" }}
          data-testid="text-title"
        >
          VibeGotchi
        </h1>
        <p className="text-sm text-white/40">
          Your GitHub commits. Your creature. Don't let it die.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* INPUT PHASE */}
        {phase === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm flex flex-col items-center gap-6"
          >
            <form onSubmit={handleSummon} className="w-full flex flex-col gap-3">
              <input
                data-testid="input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter any GitHub username..."
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-[--neon-green] focus:ring-1 focus:ring-[--neon-green]/30 transition-all"
                autoComplete="off"
                spellCheck={false}
              />
              <motion.button
                data-testid="button-summon"
                type="submit"
                disabled={!username.trim()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--neon-green)" }}
              >
                Summon My Pet
              </motion.button>
            </form>
            <p className="text-xs text-white/25 text-center">No login required. Any public GitHub username works.</p>
          </motion.div>
        )}

        {/* LOADING PHASE */}
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm"
          >
            <LoadingEgg />
          </motion.div>
        )}

        {/* ERROR PHASE */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center gap-6"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Sad egg */}
              <svg width="100" height="116" viewBox="0 0 120 140" fill="none">
                <ellipse cx="60" cy="75" rx="45" ry="58" fill="#1e1e2e" stroke="#444466" strokeWidth="2" />
                <circle cx="46" cy="70" r="5" fill="#666677" />
                <circle cx="74" cy="70" r="5" fill="#666677" />
                <path d="M50 92 Q60 86 70 92" stroke="#666677" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
              <p className="text-sm text-white/60 text-center max-w-xs">{error?.message}</p>
            </div>
            <motion.button
              data-testid="button-try-again"
              onClick={handleReset}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
            >
              Try again
            </motion.button>
          </motion.div>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && petData && mood && vibeResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl flex flex-col gap-6"
          >
            {/* Username & personality */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-lg font-semibold text-white">{petData.username}</h2>
              <p className="font-pixel text-[9px] text-white/40 mt-1 tracking-widest uppercase">{vibeResult.petPersonality}</p>
            </motion.div>

            {/* Pet + Stats layout */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Pet area */}
              <div className="flex flex-col items-center gap-4 w-full lg:w-auto lg:min-w-[240px]">
                <PetSprite stage={stage} colors={colors} accessories={accessories} />

                <MoodBadge emoji={mood.emoji} label={mood.label} tier={mood.tier} />

                <div className="flex flex-col items-center gap-3">
                  <ShareButton
                    level={level}
                    stage={stage}
                    moodEmoji={mood.emoji}
                    moodLabel={mood.label}
                  />
                  <Link
                    href="/leaderboard"
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    data-testid="link-leaderboard"
                  >
                    View Leaderboard →
                  </Link>
                </div>
              </div>

              {/* Stats panel */}
              <div className="flex-1 w-full">
                <StatsPanel
                  healthPercent={healthPercent}
                  energyPercent={energyPercent}
                  commitCount30Days={petData.commitCount30Days}
                  currentStreak={petData.currentStreak}
                  level={level}
                  vibeOneLiner={vibeResult.vibeOneLiner}
                  petPersonality={vibeResult.petPersonality}
                  totalStars={petData.totalStars}
                  totalRepos={petData.totalRepos}
                />
              </div>
            </div>

            {/* Search another */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center"
            >
              <button
                data-testid="button-search-another"
                onClick={handleReset}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Search another username
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
