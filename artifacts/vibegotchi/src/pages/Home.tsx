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

type Phase = "input" | "loading" | "evolution" | "result" | "error" | "roast";
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

const EXAMPLE_USERS = ["torvalds", "sindresorhus", "wesbos", "gaearon"];

const FEATURES = [
  { icon: "🐾", title: "Evolves with commits", desc: "Egg → Baby → Teen → Adult → Legend based on your 30-day activity" },
  { icon: "⚔️", title: "Battle other devs", desc: "Challenge anyone by username. Commits decide the winner." },
  { icon: "🤖", title: "AI reads your vibe", desc: "GPT-4 analyzes your commit messages and assigns a coding personality" },
];

const CHIP_TOOLTIPS: Record<string, string> = {
  torvalds: "torvalds → 👑 Legend",
  sindresorhus: "sindresorhus → 👑 Legend",
  wesbos: "wesbos → 👑 Legend",
  gaearon: "gaearon → 👑 Legend",
};

const DUST = Array.from({ length: 30 }, (_, i) => ({
  id: 2000 + i,
  x: Math.round((i * 61.8) % 100),
  delay: (i * 0.71) % 14,
  dur: 9 + (i * 0.83) % 12,
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
            animate={{ opacity: [0.05, s.size === 3 ? 0.9 : 0.65, 0.05] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ))}
        {DUST.map((d) => (
          <motion.div
            key={d.id}
            className="absolute rounded-sm"
            style={{ left: `${d.x}%`, bottom: "-2%", width: 2, height: 2, backgroundColor: "rgba(57,255,20,0.35)" }}
            animate={{ y: [0, -1100], opacity: [0, 0.7, 0.5, 0] }}
            transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "linear", times: [0, 0.08, 0.88, 1] }}
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
  const [petCount, setPetCount] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("vg_summon_count") ?? "1247", 10) || 1247; } catch { return 1247; }
  });

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
    if (u.toLowerCase() === "roastme") { setPhase("roast"); return; }
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

      setPetCount((c) => { const n = c + 1; try { localStorage.setItem("vg_summon_count", String(n)); } catch {} return n; });
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
    <div className="relative min-h-screen bg-space flex flex-col items-center overflow-x-hidden w-full px-4 py-4 sm:py-8">
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
        <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-5">
          <div className="hidden xs:block sm:block" aria-hidden="true"><MiniPetPreview /></div>
          <h1
            className="font-pixel text-white animate-rainbow-glow leading-tight"
            style={{ fontSize: "clamp(1.4rem, 6vw, 2.8rem)" }}
            data-testid="text-title"
          >
            VibeGotchi
          </h1>
          <div className="hidden xs:block sm:block" aria-hidden="true"><MiniPetPreview /></div>
        </div>

        <p className="relative z-10 text-base sm:text-lg text-white/60 font-medium max-w-sm leading-snug">
          Your GitHub commits. Your creature.{" "}
          <span className="text-white/90 font-semibold">Don't let it die.</span>
        </p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 text-xs text-white/30"
        >
          🐾{" "}
          <motion.span
            key={petCount}
            initial={{ scale: 1.4, color: "#39ff14" }}
            animate={{ scale: 1, color: "rgba(57,255,20,0.65)" }}
            transition={{ duration: 0.5 }}
            className="font-semibold"
          >
            {petCount.toLocaleString()}
          </motion.span>
          {" "}pets summoned so far
        </motion.p>
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
                className="input-summon w-full px-5 py-4 min-h-[56px] rounded-2xl bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-base outline-none transition-all"
                autoComplete="off"
                spellCheck={false}
              />
              <motion.button
                data-testid="button-summon"
                type="submit"
                disabled={!username.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 min-h-[56px] rounded-2xl font-bold text-base text-black transition-all disabled:opacity-35 disabled:cursor-not-allowed btn-summon"
              >
                Summon My Pet ✨
              </motion.button>
              <p className="text-xs text-white/20 text-center">
                Press{" "}
                <kbd className="font-pixel text-[7px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.12]">Enter</kbd>
                {" "}to summon
              </p>
            </form>

            {/* Example username chips */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-white/25">Try a legend:</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {EXAMPLE_USERS.map((u, idx) => (
                  <motion.button
                    key={u}
                    type="button"
                    title={CHIP_TOOLTIPS[u]}
                    onClick={() => { setUsername(u); void doFetch(u); }}
                    whileHover={{ scale: 1.06, backgroundColor: "rgba(57,255,20,0.15)" }}
                    whileTap={{ scale: 0.94 }}
                    className="relative overflow-hidden px-3 py-1.5 min-h-[36px] rounded-full text-xs text-[--neon-green] border border-[--neon-green]/20 bg-[--neon-green]/[0.05] transition-colors font-mono"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none rounded-full"
                      style={{
                        background: "linear-gradient(105deg, transparent 35%, rgba(57,255,20,0.35) 50%, transparent 65%)",
                        animation: `chip-shimmer ${2.4 + idx * 0.6}s ease-in-out ${idx * 0.5}s infinite`,
                      }}
                    />
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
              className="px-8 py-3 min-h-[48px] rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
            >
              Try again
            </motion.button>
          </motion.div>
        )}

        {/* ── ROAST MODE ── */}
        {mode === "solo" && phase === "roast" && (
          <motion.div
            key="roast"
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.93 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-sm flex flex-col items-center gap-5 text-center"
          >
            <motion.div
              animate={{ rotate: [-6, 6, -6], y: [0, -10, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-6xl select-none"
            >
              💀
            </motion.div>

            <div className="roast-badge glass rounded-2xl p-6 border border-red-500/20 bg-red-500/[0.04] w-full">
              <p className="font-pixel text-[9px] text-red-400 tracking-widest mb-4">
                🔥 ROAST INCOMING
              </p>
              <p className="text-sm text-white/80 leading-relaxed">
                No GitHub account? So you're the person who says{" "}
                <span className="text-white/95 font-semibold italic">"I know how to code"</span>{" "}
                at parties.
              </p>
              <p className="text-sm text-white/65 leading-relaxed mt-3">
                Respect the hustle. Now go make a repo. 💀
              </p>
            </div>

            <motion.button
              onClick={async () => {
                try { await navigator.clipboard.writeText("I got roasted by VibeGotchi 💀 vibegotchi.app"); } catch {}
                sounds.sharePop();
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 min-h-[52px] rounded-2xl font-bold text-sm text-black btn-summon"
            >
              Share My Roast 💀
            </motion.button>

            <button
              onClick={handleReset}
              className="text-xs text-white/25 hover:text-white/55 transition-colors"
            >
              Try a real username →
            </button>
          </motion.div>
        )}

        {/* ── RESULT ── */}
        {mode === "solo" && phase === "result" && petData && mood && vibeResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full max-w-2xl flex flex-col gap-4 sm:gap-6 rounded-3xl p-4 sm:p-6"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${colors.accent}28`,
              boxShadow: `0 0 60px ${colors.accent}10`,
            }}
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
            <div className="flex flex-col md:flex-row gap-4 sm:gap-5 items-center md:items-start">
              {/* Pet column */}
              <div className="flex flex-col items-center gap-1 sm:gap-2 w-full md:flex-1 md:min-w-[220px]">
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

                {vibeResult && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.65, type: "spring", stiffness: 280 }}
                    className="font-pixel px-2.5 py-0.5 rounded-full text-[8px] tracking-widest border"
                    style={{
                      color: stage === "legend" ? "#fbbf24" : colors.accent,
                      borderColor: (stage === "legend" ? "#fbbf24" : colors.accent) + "44",
                      backgroundColor: (stage === "legend" ? "#fbbf24" : colors.accent) + "12",
                    }}
                  >
                    {vibeResult.petPersonality.toUpperCase()}
                  </motion.span>
                )}

                <div className="pet-breathe">
                  <PetSprite
                    stage={stage}
                    colors={colors}
                    accessories={accessories}
                    streakDays={petData.currentStreak}
                  />
                </div>
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
              <div className="w-full md:flex-1">
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
      <footer className="relative mt-auto pt-8 pb-6 w-full max-w-2xl">
        <div className="border-t pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0" style={{ borderColor: "rgba(57,255,20,0.1)" }}>
          <span className="font-pixel text-[7px] text-white/25">VibeGotchi 🐾</span>
          <p className="text-xs text-white/20 italic text-center">
            No pets were harmed in the making of this app. Some developers were. 🐾
          </p>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-white/20 hover:text-white/55 transition-colors">Home</Link>
            <span className="text-white/10">·</span>
            <Link href="/leaderboard" className="text-xs text-white/20 hover:text-white/55 transition-colors">Leaderboard</Link>
            <span className="text-white/10">·</span>
            <button
              onClick={() => { setMode("battle"); handleReset(); }}
              className="text-xs text-white/20 hover:text-white/55 transition-colors"
            >
              Battle
            </button>
            <span className="text-white/10">·</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/20 hover:text-white/55 transition-colors"
              title="GitHub"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
