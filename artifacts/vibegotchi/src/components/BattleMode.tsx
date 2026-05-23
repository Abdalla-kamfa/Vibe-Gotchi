import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchGitHubPetData, type GitHubPetData } from "../lib/github";
import {
  getPetStage, getPetColors, getMood, getLevel,
  getAccessories, getHealthPercent, getEnergyPercent,
} from "../lib/petLogic";
import { analyzeVibe } from "../lib/openai";
import { generatePetName } from "../lib/petName";
import { sounds } from "../lib/sounds";
import { PetSprite } from "./PetSprite";
import { MoodBadge } from "./MoodBadge";
import type { VibeResult } from "@workspace/api-client-react";

interface BattlePetData {
  username: string;
  data: GitHubPetData;
  vibeResult: VibeResult;
}

type BattlePhase = "input" | "loading" | "result" | "error";

function calcScore(d: GitHubPetData) {
  return d.commitCount30Days * 3 + d.currentStreak * 2 + getLevel(d.totalRepos, d.totalStars) * 5;
}

function statColor(mine: number, theirs: number) {
  if (mine > theirs) return "#39ff14";
  if (mine < theirs) return "#ef4444";
  return "rgba(255,255,255,0.35)";
}

interface StatRowProps { label: string; v1: number; v2: number; fmt?: (n: number) => string }
function StatRow({ label, v1, v2, fmt = String }: StatRowProps) {
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-right text-sm font-semibold" style={{ color: statColor(v1, v2) }}>{fmt(v1)}</span>
      <span className="text-center font-pixel text-[7px] text-white/30 tracking-wide">{label}</span>
      <span className="text-left text-sm font-semibold"  style={{ color: statColor(v2, v1) }}>{fmt(v2)}</span>
    </div>
  );
}

interface BattlePetCardProps {
  pet: BattlePetData;
  isWinner: boolean;
  isTie: boolean;
  showResult: boolean;
}
function BattlePetCard({ pet, isWinner, isTie, showResult }: BattlePetCardProps) {
  const level   = getLevel(pet.data.totalRepos, pet.data.totalStars);
  const stage   = getPetStage(pet.data.commitCount30Days, level);
  const colors  = getPetColors(pet.data.topLanguage);
  const acc     = getAccessories(pet.data.topLanguage, pet.data.totalStars, pet.data.daysSinceLastCommit, pet.data.commitCount30Days);
  const mood    = getMood(pet.data.daysSinceLastCommit, pet.vibeResult.moodBoost as "positive" | "neutral" | "negative");
  const petName = generatePetName(pet.username, pet.data.topLanguage);
  const isLoser = showResult && !isWinner && !isTie;

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      <AnimatePresence>
        {showResult && (
          <motion.div
            key="badge"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-pixel text-[9px] tracking-widest"
            style={{ color: isWinner ? "#fbbf24" : isTie ? "rgba(255,255,255,0.3)" : "#ef4444" }}
          >
            {isWinner ? "👑 WINNER" : isTie ? "🤝 TIE" : "💀 DEFEATED"}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={
          !showResult      ? { y: [0, -8, 0] } :
          isWinner         ? { y: [0, -18, 0], scale: [1, 1.06, 1] } :
          isTie            ? { y: [0, -6, 0] } :
                             { y: [0, 6, 0], rotate: [-2, 2, -2] }
        }
        transition={{ duration: isWinner ? 1.1 : 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter: isLoser
            ? "grayscale(0.75) brightness(0.7)"
            : isWinner
            ? `drop-shadow(0 0 16px ${colors.accent})`
            : undefined,
          opacity: isLoser ? 0.7 : 1,
        }}
      >
        <PetSprite stage={stage} colors={colors} accessories={acc} streakDays={pet.data.currentStreak} />
      </motion.div>

      <div className="text-center">
        <p className="font-semibold text-white text-sm">{pet.username}</p>
        <p className="font-pixel text-[8px] tracking-wider mt-0.5" style={{ color: colors.accent }}>{petName}</p>
        <p className="text-xs text-white/40 mt-1">{mood.emoji} {mood.label}</p>
      </div>
    </div>
  );
}

export function BattleMode() {
  const [username1, setUsername1] = useState("");
  const [username2, setUsername2] = useState("");
  const [phase, setPhase] = useState<BattlePhase>("input");
  const [pet1, setPet1] = useState<BattlePetData | null>(null);
  const [pet2, setPet2] = useState<BattlePetData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reveal winner after 2-second dramatic pause
  useEffect(() => {
    if (phase !== "result") { setShowResult(false); return; }
    const t = setTimeout(() => setShowResult(true), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  const handleBattle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username1.trim() || !username2.trim()) return;
    setPhase("loading");
    setShowResult(false);
    sounds.battle();
    try {
      const [data1, data2] = await Promise.all([
        fetchGitHubPetData(username1.trim()),
        fetchGitHubPetData(username2.trim()),
      ]);
      const [vibe1, vibe2] = await Promise.all([
        analyzeVibe(data1.recentCommitMessages, data1.topLanguage, data1.commitCount30Days, data1.daysSinceLastCommit),
        analyzeVibe(data2.recentCommitMessages, data2.topLanguage, data2.commitCount30Days, data2.daysSinceLastCommit),
      ]);
      setPet1({ username: username1.trim(), data: data1, vibeResult: vibe1 });
      setPet2({ username: username2.trim(), data: data2, vibeResult: vibe2 });
      setPhase("result");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setErrorMsg(
        msg === "USER_NOT_FOUND" ? "One of these doesn't exist on GitHub (or they rage-deleted their account)."
        : msg === "RATE_LIMITED"  ? "GitHub is being dramatic. Try again in a moment. It's not you, it's them."
        : "Something exploded in the git void. Try again.",
      );
      setPhase("error");
    }
  }, [username1, username2]);

  // Play sounds when winner is revealed
  useEffect(() => {
    if (!showResult || !pet1 || !pet2) return;
    const s1 = calcScore(pet1.data);
    const s2 = calcScore(pet2.data);
    if (s1 !== s2) sounds.victory(); else sounds.pop();
  }, [showResult, pet1, pet2]);

  function handleReset() {
    setPhase("input"); setPet1(null); setPet2(null); setErrorMsg(""); setShowResult(false);
  }

  async function handleShare() {
    if (!pet1 || !pet2) return;
    const s1 = calcScore(pet1.data), s2 = calcScore(pet2.data);
    const winner = s1 > s2 ? pet1.username : s2 > s1 ? pet2.username : null;
    const loser  = winner === pet1.username ? pet2.username : pet1.username;
    const text = winner
      ? `My VibeGotchi just destroyed @${loser} in a pet battle 🔥 Check yours at vibegotchi.app`
      : `${pet1.username} and ${pet2.username} tied in a VibeGotchi battle 🤝 vibegotchi.app`;
    await navigator.clipboard.writeText(text);
    sounds.sharePop();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (phase === "input" || phase === "error") {
    return (
      <div className="w-full max-w-md flex flex-col gap-4">
        <form onSubmit={handleBattle} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-pixel text-[8px] text-white/40 tracking-wide">FIGHTER 1</label>
              <input
                value={username1}
                onChange={(e) => setUsername1(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-sm outline-none focus:border-[--neon-green] transition-all"
                autoComplete="off" spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-pixel text-[8px] text-white/40 tracking-wide">FIGHTER 2</label>
              <input
                value={username2}
                onChange={(e) => setUsername2(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-sm outline-none focus:border-red-500/60 transition-all"
                autoComplete="off" spellCheck={false}
              />
            </div>
          </div>
          {phase === "error" && <p className="text-xs text-red-400/80 text-center">{errorMsg}</p>}
          <motion.button
            type="submit"
            disabled={!username1.trim() || !username2.trim()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(-45deg, #dc2626, #ef4444, #b91c1c)", backgroundSize: "200% 200%" }}
          >
            START BATTLE ⚔️
          </motion.button>
        </form>
        <p className="text-xs text-white/20 text-center">Commits decide the winner. No mercy.</p>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          className="text-3xl"
        >⚔️</motion.div>
        <p className="font-pixel text-[9px] text-white/50 tracking-widest">LOADING FIGHTERS...</p>
        <p className="text-xs text-white/30">Pulling battle data from the git void...</p>
      </div>
    );
  }

  if (phase === "result" && pet1 && pet2) {
    const s1 = calcScore(pet1.data), s2 = calcScore(pet2.data);
    const tie = s1 === s2, p1Wins = s1 > s2;
    const winner = tie ? null : p1Wins ? pet1 : pet2;
    const loser  = tie ? null : p1Wins ? pet2 : pet1;
    const l1 = getLevel(pet1.data.totalRepos, pet1.data.totalStars);
    const l2 = getLevel(pet2.data.totalRepos, pet2.data.totalStars);
    const h1 = getHealthPercent(pet1.data.daysSinceLastCommit);
    const h2 = getHealthPercent(pet2.data.daysSinceLastCommit);

    return (
      <div className="w-full max-w-2xl flex flex-col gap-5">
        {/* Pets — stack on mobile, side-by-side on md+ */}
        <div className="flex flex-col md:flex-row gap-4 items-center md:items-start justify-center">
          <BattlePetCard pet={pet1} isWinner={!tie && p1Wins} isTie={tie} showResult={showResult} />

          {/* VS divider — horizontal on mobile, vertical on md+ */}
          <div className="flex md:flex-col items-center justify-center self-center gap-1 shrink-0 my-2 md:my-0">
            <motion.span
              className="font-pixel text-lg"
              style={{ color: "#ef4444" }}
              animate={{ opacity: [0.6, 1, 0.6], textShadow: ["0 0 8px #ef4444", "0 0 24px #ef4444", "0 0 8px #ef4444"] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >VS</motion.span>
          </div>

          <BattlePetCard pet={pet2} isWinner={!tie && !p1Wins} isTie={tie} showResult={showResult} />
        </div>

        {/* Winner banner — appears after 2s delay */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 glass p-4 text-center flex flex-col gap-1"
            >
              {tie ? (
                <p className="font-pixel text-[9px] text-white/60 tracking-wide">DEAD EVEN. Both pets glare in mutual confusion.</p>
              ) : (
                <>
                  <p className="font-pixel text-[9px] tracking-wide" style={{ color: "#fbbf24" }}>
                    🏆 {winner!.username} WINS! Their pet obliterates {loser!.username}'s ghost
                  </p>
                  <p className="text-xs text-white/30 mt-1">💀 {loser!.username} needs to touch a keyboard</p>
                  <p className="text-xs text-white/20 mt-0.5">
                    {winner!.data.commitCount30Days} commits vs {loser!.data.commitCount30Days} in the last 30 days
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stat comparison */}
        <div className="rounded-2xl glass p-4 flex flex-col">
          <div className="grid grid-cols-3 mb-2">
            <span className="text-right text-xs font-semibold text-white/45 truncate pr-2">{pet1.username}</span>
            <span className="text-center font-pixel text-[7px] text-white/20 tracking-wide">STATS</span>
            <span className="text-left  text-xs font-semibold text-white/45 truncate pl-2">{pet2.username}</span>
          </div>
          <StatRow label="COMMITS" v1={pet1.data.commitCount30Days} v2={pet2.data.commitCount30Days} />
          <StatRow label="LEVEL"   v1={l1} v2={l2} />
          <StatRow label="HEALTH"  v1={h1} v2={h2} fmt={(n) => `${n}%`} />
          <StatRow label="STREAK"  v1={pet1.data.currentStreak}    v2={pet2.data.currentStreak}    fmt={(n) => `${n}d`} />
          <StatRow label="STARS"   v1={pet1.data.totalStars}       v2={pet2.data.totalStars} />
          <StatRow label="ENERGY"  v1={getEnergyPercent(Math.ceil(pet1.data.commitCount30Days*.4), Math.ceil(pet1.data.commitCount30Days*.3))} v2={getEnergyPercent(Math.ceil(pet2.data.commitCount30Days*.4), Math.ceil(pet2.data.commitCount30Days*.3))} fmt={(n) => `${n}%`} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm text-black btn-summon"
          >
            {copied ? "Copied! 🎉" : "Share Battle 🔥"}
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 rounded-xl text-sm text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
          >
            New Battle
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
}
