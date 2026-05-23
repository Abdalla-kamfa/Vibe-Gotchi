import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { fetchGitHubPetData, type GitHubPetData } from "../lib/github";
import {
  getPetStage, getPetColors, getMood, getLevel,
  getAccessories, getHealthPercent, getEnergyPercent,
} from "../lib/petLogic";
import { analyzeVibe } from "../lib/openai";
import { saveToLeaderboard } from "../lib/leaderboard";
import { generatePetName } from "../lib/petName";
import { sounds } from "../lib/sounds";
import { PetSprite } from "../components/PetSprite";
import { StatsPanel } from "../components/StatsPanel";
import { MoodBadge } from "../components/MoodBadge";
import { ShareButton } from "../components/ShareButton";
import { LoadingEgg } from "../components/LoadingEgg";
import { EvolutionAnimation } from "../components/EvolutionAnimation";
import { BattleMode } from "../components/BattleMode";
import type { VibeResult } from "@workspace/api-client-react";

type Phase = "input" | "loading" | "evolution" | "result" | "error";
type AppMode = "solo" | "battle";

interface ErrorState {
  type: "not_found" | "rate_limited" | "generic";
  message: string;
}

const STARS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  x: Math.round((i * 137.5) % 100),
  y: Math.round((i * 97.3) % 100),
  size: i % 3 === 0 ? 2 : 1,
  delay: (i * 0.43) % 3,
  dur: 2 + (i * 0.31) % 3,
}));

function BackgroundEffects() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {STARS.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="scanlines fixed inset-0 pointer-events-none z-10" aria-hidden="true" />
    </>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [mode, setMode] = useState<AppMode>("solo");
  const [username, setUsername] = useState("");
  const [petData, setPetData] = useState<GitHubPetData | null>(null);
  const [vibeResult, setVibeResult] = useState<VibeResult | null>(null);
  const [petName, setPetName] = useState("");
  const [error, setError] = useState<ErrorState | null>(null);
  const [muted, setMuted] = useState(sounds.muted);

  function handleToggleMute() {
    const nowMuted = sounds.toggle();
    setMuted(nowMuted);
  }

  const level = useMemo(() => petData ? getLevel(petData.totalRepos, petData.totalStars) : 0, [petData]);
  const stage = useMemo(() => petData ? getPetStage(petData.commitCount30Days, level) : "egg", [petData, level]);
  const colors = useMemo(() => petData ? getPetColors(petData.topLanguage) : { fill: "#22c55e", accent: "#86efac" }, [petData]);
  const accessories = useMemo(() => petData ? getAccessories(petData.topLanguage, petData.totalStars, petData.daysSinceLastCommit, petData.commitCount30Days) : [], [petData]);
  const mood = useMemo(() => petData ? getMood(petData.daysSinceLastCommit, vibeResult?.moodBoost as "positive" | "neutral" | "negative" | undefined) : null, [petData, vibeResult]);
  const healthPercent = useMemo(() => petData ? getHealthPercent(petData.daysSinceLastCommit) : 0, [petData]);
  const energyPercent = useMemo(() => petData ? getEnergyPercent(
    petData.commitCount30Days > 0 ? Math.ceil(petData.commitCount30Days * 0.4) : 0,
    petData.commitCount30Days > 0 ? Math.ceil(petData.commitCount30Days * 0.3) : 0,
  ) : 0, [petData]);

  // Play sounds when result appears
  useEffect(() => {
    if (phase === "result" && petData) {
      if (petData.commitCount30Days === 0 || petData.daysSinceLastCommit >= 14) {
        sounds.sadTone();
      } else if (stage === "legend") {
        sounds.levelUp();
      } else {
        sounds.pop();
      }
    }
  }, [phase, petData, stage]);

  const handleSummon = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    sounds.click();
    setPhase("loading");
    setError(null);

    try {
      const data = await fetchGitHubPetData(trimmed);
      setPetData(data);

      const vibe = await analyzeVibe(
        data.recentCommitMessages, data.topLanguage,
        data.commitCount30Days, data.daysSinceLastCommit,
      );
      setVibeResult(vibe);

      const lvl = getLevel(data.totalRepos, data.totalStars);
      const stg = getPetStage(data.commitCount30Days, lvl);
      const mood = getMood(data.daysSinceLastCommit, vibe.moodBoost as "positive" | "neutral" | "negative");
      const name = generatePetName(data.username, data.topLanguage);
      setPetName(name);

      saveToLeaderboard({
        username: data.username,
        stage: stg,
        level: lvl,
        mood: `${mood.emoji} ${mood.label}`,
        timestamp: Date.now(),
      });

      setPhase("evolution");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "GENERIC";
      if (msg === "USER_NOT_FOUND") {
        setError({ type: "not_found", message: "Either this person doesn't exist or they deleted everything out of shame." });
      } else if (msg === "RATE_LIMITED") {
        setError({ type: "rate_limited", message: "GitHub is being shy. Try again in a moment." });
      } else {
        setError({ type: "generic", message: "Something went wrong in the void. Try again." });
      }
      setPhase("error");
    }
  }, [username]);

  function handleReset() {
    setPhase("input");
    setPetData(null);
    setVibeResult(null);
    setError(null);
    setPetName("");
  }

  const commitWarning = petData?.commitCount30Days === 0
    ? "Your pet hasn't eaten in weeks. This is a cry for help."
    : null;

  return (
    <div className="relative min-h-screen bg-space flex flex-col items-center px-4 py-4 sm:py-8">
      <BackgroundEffects />

      {/* Mute button — top right */}
      <button
        onClick={handleToggleMute}
        className="fixed top-4 right-4 z-50 w-9 h-9 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-base hover:bg-white/10 transition-colors"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative text-center mb-4 sm:mb-6 w-full max-w-lg"
      >
        <h1
          className="font-pixel text-2xl sm:text-3xl text-white mb-2"
          style={{ textShadow: "0 0 20px rgba(57,255,20,0.5), 0 0 40px rgba(147,51,234,0.3)" }}
          data-testid="text-title"
        >
          VibeGotchi
        </h1>
        <p className="text-sm text-white/40">Your GitHub commits. Your creature. Don't let it die.</p>
      </motion.div>

      {/* Mode toggle — Solo / Battle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-5 sm:mb-7"
      >
        {(["solo", "battle"] as AppMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); handleReset(); }}
            className="relative px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={mode === m
              ? { backgroundColor: m === "battle" ? "#ff4444" : "var(--neon-green)", color: "#000" }
              : { color: "rgba(255,255,255,0.4)" }
            }
          >
            {m === "solo" ? "Solo" : "Battle 🥊"}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── BATTLE MODE ── */}
        {mode === "battle" && (
          <motion.div
            key="battle"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative w-full max-w-2xl flex flex-col items-center gap-4"
          >
            <BattleMode />
          </motion.div>
        )}

        {/* ── SOLO INPUT ── */}
        {mode === "solo" && phase === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-sm flex flex-col items-center gap-6"
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

        {/* ── LOADING ── */}
        {mode === "solo" && phase === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-sm">
            <LoadingEgg />
          </motion.div>
        )}

        {/* ── EVOLUTION ANIMATION ── */}
        {mode === "solo" && phase === "evolution" && (
          <motion.div key="evolution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-sm">
            <EvolutionAnimation
              stage={stage}
              colors={colors}
              onComplete={() => setPhase("result")}
            />
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {mode === "solo" && phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative w-full max-w-sm flex flex-col items-center gap-6"
          >
            <div className="flex flex-col items-center gap-4">
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

        {/* ── RESULT ── */}
        {mode === "solo" && phase === "result" && petData && mood && vibeResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-2xl flex flex-col gap-3 sm:gap-5"
          >
            {/* Username + personality */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-lg font-semibold text-white">{petData.username}</h2>
              <p
                className="font-pixel text-[9px] mt-1 tracking-widest uppercase"
                style={{ color: "#c084fc", textShadow: "0 0 10px rgba(192,132,252,0.6), 0 0 24px rgba(147,51,234,0.35)" }}
              >
                {vibeResult.petPersonality}
              </p>
            </motion.div>

            {/* 0-commit warning */}
            {commitWarning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-center"
              >
                <p className="text-xs text-red-400/80">{commitWarning}</p>
              </motion.div>
            )}

            {/* Pet + Stats */}
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-5 items-center lg:items-start">
              {/* Pet column */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 w-full lg:flex-1 lg:min-w-[260px]">
                {/* Pet name */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-pixel text-[8px] tracking-widest"
                  style={{ color: colors.accent, textShadow: `0 0 8px ${colors.accent}88` }}
                >
                  {petName}
                </motion.p>

                <PetSprite
                  stage={stage}
                  colors={colors}
                  accessories={accessories}
                  streakDays={petData.currentStreak}
                />
                <MoodBadge emoji={mood.emoji} label={mood.label} tier={mood.tier} />
                <div className="flex flex-col items-center gap-2 mt-1">
                  <ShareButton level={level} stage={stage} moodEmoji={mood.emoji} moodLabel={mood.label} />
                  <Link
                    href="/leaderboard"
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    data-testid="link-leaderboard"
                  >
                    View Leaderboard →
                  </Link>
                </div>
              </div>

              {/* Stats column */}
              <div className="w-full lg:flex-1">
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center pb-2"
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

      {/* Footer */}
      <footer className="relative mt-auto pt-12 pb-2 text-center flex flex-col gap-2">
        <p className="text-xs text-white/15 italic">No pets were harmed in the making of this app. Some developers were.</p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="text-xs text-white/20 hover:text-white/50 transition-colors">Home</Link>
          <span className="text-white/10">·</span>
          <Link href="/leaderboard" className="text-xs text-white/20 hover:text-white/50 transition-colors">Leaderboard</Link>
          <span className="text-white/10">·</span>
          <button
            onClick={() => { setMode("battle"); handleReset(); }}
            className="text-xs text-white/20 hover:text-white/50 transition-colors"
          >
            Battle
          </button>
        </div>
      </footer>
    </div>
  );
}
