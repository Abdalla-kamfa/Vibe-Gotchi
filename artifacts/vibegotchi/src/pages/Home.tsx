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

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.round((i * 137.5) % 100),
  y: Math.round((i * 97.3) % 100),
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  delay: (i * 0.43) % 4,
  dur: 1.8 + (i * 0.31) % 3.5,
}));

const EXAMPLE_USERS = ["torvalds", "sindresorhus", "wesbos"];

const FEATURES = [
  { icon: "🐾", title: "Evolves with commits", desc: "Egg → Baby → Teen → Adult → Legend based on your 30-day activity" },
  { icon: "⚔️", title: "Battle other devs", desc: "Challenge anyone by username. Commits decide the winner." },
  { icon: "🤖", title: "AI reads your vibe", desc: "GPT-4 analyzes your commit messages and assigns a coding personality" },
];

function BackgroundEffects() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {STARS.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ opacity: [0.05, s.size === 3 ? 0.9 : 0.65, 0.05] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="scanlines fixed inset-0 pointer-events-none z-10" aria-hidden="true" />
    </>
  );
}

function MiniPetPreview() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="select-none"
      aria-hidden="true"
    >
      <svg width="56" height="56" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Baby pet body */}
        <ellipse cx="100" cy="120" rx="54" ry="52" fill="#22c55e" />
        <ellipse cx="100" cy="110" rx="46" ry="44" fill="#4ade80" />
        {/* Eyes */}
        <ellipse cx="85" cy="105" rx="9" ry="10" fill="white" />
        <ellipse cx="115" cy="105" rx="9" ry="10" fill="white" />
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.5 }}
          style={{ transformOrigin: "100px 105px" }}
        >
          <circle cx="87" cy="106" r="5" fill="#0f172a" />
          <circle cx="117" cy="106" r="5" fill="#0f172a" />
          <circle cx="89" cy="104" r="2" fill="white" />
          <circle cx="119" cy="104" r="2" fill="white" />
        </motion.g>
        {/* Smile */}
        <path d="M88 122 Q100 132 112 122" stroke="#166534" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Ears */}
        <ellipse cx="60" cy="80" rx="14" ry="18" fill="#22c55e" transform="rotate(-15 60 80)" />
        <ellipse cx="140" cy="80" rx="14" ry="18" fill="#22c55e" transform="rotate(15 140 80)" />
        <ellipse cx="60" cy="80" rx="8" ry="11" fill="#86efac" transform="rotate(-15 60 80)" />
        <ellipse cx="140" cy="80" rx="8" ry="11" fill="#86efac" transform="rotate(15 140 80)" />
      </svg>
    </motion.div>
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");
  const [showCommitToast, setShowCommitToast] = useState(false);

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

  // Silent background refresh every 30 seconds while on result screen
  const silentRefresh = useCallback(async (user: string) => {
    setIsRefreshing(true);
    try {
      const data = await fetchGitHubPetData(user);
      const vibe = await analyzeVibe(
        data.recentCommitMessages, data.topLanguage,
        data.commitCount30Days, data.daysSinceLastCommit,
      );
      setPetData((prev) => {
        if (prev && data.commitCount30Days > prev.commitCount30Days) {
          setShowCommitToast(true);
          setTimeout(() => setShowCommitToast(false), 4500);
        }
        return data;
      });
      setVibeResult(vibe);
      setLastUpdated(new Date());
    } catch (_) {
      // silently ignore refresh errors — don't interrupt the user
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (phase !== "result" || !petData) return;
    setLastUpdated(new Date());
    const id = setInterval(() => silentRefresh(petData.username), 30_000);
    return () => clearInterval(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the "X ago" label fresh without re-running the refresh
  useEffect(() => {
    if (!lastUpdated) return;
    function recalc() {
      if (!lastUpdated) return;
      const secs = Math.round((Date.now() - lastUpdated.getTime()) / 1000);
      if (secs < 5) setTimeAgo("just now");
      else if (secs < 60) setTimeAgo(`${secs}s ago`);
      else setTimeAgo(`${Math.floor(secs / 60)}m ago`);
    }
    recalc();
    const id = setInterval(recalc, 5_000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const doFetch = useCallback(async (u: string) => {
    setPhase("loading");
    setError(null);

    try {
      const data = await fetchGitHubPetData(u);
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
        petName: name,
        timestamp: Date.now(),
      });

      setPhase("evolution");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "GENERIC";
      if (msg === "USER_NOT_FOUND") {
        setError({ type: "not_found", message: "Either this person doesn't exist, or they deleted everything out of shame. Both are valid." });
      } else if (msg === "RATE_LIMITED") {
        setError({ type: "rate_limited", message: "GitHub is being dramatic. Try again in a moment. It's not you, it's them." });
      } else {
        setError({ type: "generic", message: "Something exploded in the git void. Try again." });
      }
      setPhase("error");
    }
  }, []);

  const handleSummon = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;
    sounds.click();
    await doFetch(trimmed);
  }, [username, doFetch]);

  // Auto-summon from ?u=username or switch to battle on ?battle=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("u");
    const b = params.get("battle");
    if (b === "1") {
      setMode("battle");
    }
    if (u && u.trim()) {
      setUsername(u.trim());
      doFetch(u.trim());
    }
    if (u || b) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleReset() {
    setPhase("input");
    setPetData(null);
    setVibeResult(null);
    setError(null);
    setPetName("");
  }

  const commitWarning = petData?.commitCount30Days === 0
    ? "Your pet hasn't eaten in weeks. This isn't a pet anymore. This is a cry for help."
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

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative text-center mb-6 sm:mb-8 w-full max-w-xl flex flex-col items-center gap-3"
      >
        {/* Radial glow behind title */}
        <div className="hero-glow" aria-hidden="true" />

        {/* Pet preview + title row */}
        <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-5">
          <MiniPetPreview />
          <h1
            className="font-pixel text-3xl sm:text-4xl lg:text-5xl text-white animate-rainbow-glow leading-tight"
            data-testid="text-title"
          >
            VibeGotchi
          </h1>
          <MiniPetPreview />
        </div>

        <p className="relative z-10 text-base sm:text-lg text-white/60 font-medium max-w-sm leading-snug">
          Your GitHub commits. Your creature.{" "}
          <span className="text-white/90 font-semibold">Don't let it die.</span>
        </p>
      </motion.div>

      {/* Mode toggle — premium game tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative flex gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-6 sm:mb-8"
      >
        {(["solo", "battle"] as AppMode[]).map((m) => {
          const isActive = mode === m;
          const isBattle = m === "battle";
          return (
            <motion.button
              key={m}
              onClick={() => { setMode(m); handleReset(); }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`relative px-7 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? isBattle
                    ? "bg-red-500 text-white tab-active-battle"
                    : "text-black tab-active btn-summon"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {m === "solo" ? "🎮 Solo" : "⚔️ Battle"}
              </span>
            </motion.button>
          );
        })}
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
            className="relative w-full max-w-lg flex flex-col items-center gap-5"
          >
            <form onSubmit={handleSummon} className="w-full flex flex-col gap-3">
              <input
                data-testid="input-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter any GitHub username..."
                className="input-summon w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-base outline-none transition-all"
                autoComplete="off"
                spellCheck={false}
              />
              <motion.button
                data-testid="button-summon"
                type="submit"
                disabled={!username.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold text-base text-black transition-all disabled:opacity-35 disabled:cursor-not-allowed btn-summon"
              >
                Summon My Pet ✨
              </motion.button>
            </form>

            {/* Example username chips */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-white/25">Try a legend:</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {EXAMPLE_USERS.map((u) => (
                  <motion.button
                    key={u}
                    onClick={() => setUsername(u)}
                    whileHover={{ scale: 1.06, backgroundColor: "rgba(57,255,20,0.12)" }}
                    whileTap={{ scale: 0.96 }}
                    className="px-3 py-1.5 rounded-full text-xs text-[--neon-green] border border-[--neon-green]/20 bg-[--neon-green]/[0.05] transition-colors font-mono"
                  >
                    @{u}
                  </motion.button>
                ))}
              </div>
            </div>

            <p className="text-xs text-white/20 text-center">No login required · Any public GitHub username</p>

            {/* Feature highlight cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-2"
            >
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(57,255,20,0.07)" }}
                  className="glass rounded-2xl p-4 flex flex-col gap-2 border border-white/[0.07] cursor-default"
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="font-semibold text-sm text-white/90">{f.title}</span>
                  <span className="text-xs text-white/40 leading-relaxed">{f.desc}</span>
                </motion.div>
              ))}
            </motion.div>
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
                  {timeAgo && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <motion.span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isRefreshing ? "#fbbf24" : "#39ff14" }}
                        animate={isRefreshing ? { opacity: [1, 0.2, 1] } : { opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: isRefreshing ? 0.6 : 2.5, repeat: Infinity }}
                      />
                      <span className="text-[10px] text-white/25">
                        {isRefreshing ? "Refreshing…" : `Updated ${timeAgo}`}
                      </span>
                    </div>
                  )}
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

      {/* Commit toast */}
      {showCommitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 toast-commit px-5 py-3 rounded-xl glass border border-[--neon-green]/30 text-sm text-white whitespace-nowrap">
          🎉 New commit detected! Your pet just got fed!
        </div>
      )}

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
