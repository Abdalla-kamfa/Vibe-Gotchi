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

interface StatRowProps {
  label: string;
  v1: number;
  v2: number;
  fmt?: (n: number) => string;
  showResult?: boolean;
}
function StatRow({ label, v1, v2, fmt = String, showResult }: StatRowProps) {
  const v1Wins = v1 > v2;
  const v2Wins = v2 > v1;
  return (
    <div className="grid grid-cols-3 items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-right text-sm font-semibold flex items-center justify-end gap-1" style={{ color: statColor(v1, v2) }}>
        {showResult && v1Wins && <span className="text-[11px]">✅</span>}
        {showResult && !v1Wins && v2Wins && <span className="text-[11px]">❌</span>}
        {fmt(v1)}
      </span>
      <span className="text-center font-pixel text-[7px] text-white/30 tracking-wide">{label}</span>
      <span className="text-left text-sm font-semibold flex items-center gap-1" style={{ color: statColor(v2, v1) }}>
        {fmt(v2)}
        {showResult && v2Wins && <span className="text-[11px]">✅</span>}
        {showResult && !v2Wins && v1Wins && <span className="text-[11px]">❌</span>}
      </span>
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
            initial={{ opacity: 0, scale: 0.6, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
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
          isWinner         ? { y: [0, -18, 0], scale: [1, 1.07, 1] } :
          isTie            ? { y: [0, -6, 0] } :
                             { y: [0, 6, 0], rotate: [-2, 2, -2] }
        }
        transition={{ duration: isWinner ? 1.1 : 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          filter: isLoser
            ? "grayscale(0.85) brightness(0.65)"
            : isWinner
            ? `drop-shadow(0 0 20px ${colors.accent})`
            : undefined,
          opacity: isLoser ? 0.65 : 1,
        }}
      >
        <PetSprite stage={stage} colors={colors} accessories={acc} streakDays={pet.data.currentStreak} />
      </motion.div>

      <div className="text-center">
        <p className="font-semibold text-white text-sm">{pet.username}</p>
        <p className="font-pixel text-[8px] tracking-wider mt-0.5" style={{ color: colors.accent }}>{petName}</p>
        <MoodBadge emoji={mood.emoji} label={mood.label} tier={mood.tier} />
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

  const bothFilled = username1.trim().length > 0 && username2.trim().length > 0;

  useEffect(() => {
    if (phase !== "result") { setShowResult(false); return; }
    const t = setTimeout(() => setShowResult(true), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  const handleBattle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username1.trim() || !username2.trim()) return;
    if (username1.trim().toLowerCase() === username2.trim().toLowerCase()) {
      setErrorMsg("Fighting yourself? Bold strategy. Try a different opponent — this one is too cowardly to fight back.");
      setPhase("error");
      return;
    }
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

  useEffect(() => {
    if (!showResult || !pet1 || !pet2) return;
    const s1 = calcScore(pet1.data), s2 = calcScore(pet2.data);
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
    try { await navigator.clipboard.writeText(text); } catch {}
    sounds.sharePop();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  /* ── INPUT / ERROR ── */
  if (phase === "input" || phase === "error") {
    return (
      <div className="w-full max-w-md flex flex-col gap-4">
        <form onSubmit={handleBattle} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="font-pixel text-[8px] text-white/40 tracking-wide">🥊 FIGHTER 1</label>
              <input
                value={username1}
                onChange={(e) => setUsername1(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-3 min-h-[48px] rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-base outline-none focus:border-[--neon-green] transition-all"
                autoComplete="off" spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-pixel text-[8px] text-white/40 tracking-wide">🥊 FIGHTER 2</label>
              <input
                value={username2}
                onChange={(e) => setUsername2(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-3 min-h-[48px] rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-base outline-none focus:border-red-500/60 transition-all"
                autoComplete="off" spellCheck={false}
              />
            </div>
          </div>

          {/* Ready to battle indicator */}
          <AnimatePresence>
            {bothFilled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-2 py-1"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-[--neon-green]"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="font-pixel text-[8px] text-[--neon-green] tracking-widest">⚔️ READY TO BATTLE</span>
                <motion.div
                  className="w-2 h-2 rounded-full bg-[--neon-green]"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {phase === "error" && <p className="text-xs text-red-400/80 text-center">{errorMsg}</p>}

          <motion.button
            type="submit"
            disabled={!bothFilled}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 min-h-[56px] rounded-xl font-bold text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #b91c1c 0%, #ef4444 50%, #dc2626 100%)" }}
          >
            START BATTLE ⚔️
          </motion.button>
        </form>
        <p className="text-xs text-white/20 text-center">Commits decide the winner. No mercy.</p>
      </div>
    );
  }

  /* ── LOADING ── */
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="flex items-center gap-6 sm:gap-10">
          <motion.div
            animate={{ rotate: [-12, 12, -12], y: [0, -8, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl sm:text-6xl"
          >🥚</motion.div>

          <motion.span
            className="font-pixel text-2xl"
            style={{ color: "#ef4444" }}
            animate={{
              opacity: [0.5, 1, 0.5],
              textShadow: [
                "0 0 8px #ef4444",
                "0 0 28px #ef4444, 0 0 48px #ef444466",
                "0 0 8px #ef4444",
              ],
            }}
            transition={{ duration: 0.7, repeat: Infinity }}
          >
            VS
          </motion.span>

          <motion.div
            animate={{ rotate: [12, -12, 12], y: [0, -8, 0] }}
            transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut", delay: 0.22 }}
            className="text-5xl sm:text-6xl"
          >🥚</motion.div>
        </div>
        <p className="font-pixel text-[9px] text-white/50 tracking-widest">LOADING FIGHTERS...</p>
        <p className="text-xs text-white/30">Calculating who needs to touch grass...</p>
      </div>
    );
  }

  /* ── RESULT ── */
  if (phase === "result" && pet1 && pet2) {
    const s1 = calcScore(pet1.data), s2 = calcScore(pet2.data);
    const tie = s1 === s2, p1Wins = s1 > s2;
    const winner = tie ? null : p1Wins ? pet1 : pet2;
    const loser  = tie ? null : p1Wins ? pet2 : pet1;
    const l1 = getLevel(pet1.data.totalRepos, pet1.data.totalStars);
    const l2 = getLevel(pet2.data.totalRepos, pet2.data.totalStars);
    const h1 = getHealthPercent(pet1.data.daysSinceLastCommit);
    const h2 = getHealthPercent(pet2.data.daysSinceLastCommit);
    const commitDiff = Math.abs(pet1.data.commitCount30Days - pet2.data.commitCount30Days);
    const battleCry = tie
      ? "DEAD HEAT. Both developers need to touch grass."
      : commitDiff > 20
      ? `It wasn't even close. ${winner!.username} commits in their sleep.`
      : `A nail-biter! ${winner!.username} wins by ${commitDiff} commit${commitDiff !== 1 ? "s" : ""}.`;

    return (
      <div className="w-full max-w-2xl flex flex-col gap-5">
        {/* Pets — stack on mobile, side-by-side on md+ */}
        <div className="flex flex-col md:flex-row gap-4 items-center md:items-start justify-center">
          <BattlePetCard pet={pet1} isWinner={!tie && p1Wins} isTie={tie} showResult={showResult} />

          <div className="flex md:flex-col items-center justify-center self-center gap-1 shrink-0 my-2 md:my-0">
            <motion.span
              className="font-pixel text-lg"
              style={{ color: showResult ? (tie ? "#94a3b8" : "#fbbf24") : "#ef4444" }}
              animate={{
                opacity: [0.6, 1, 0.6],
                textShadow: showResult
                  ? ["0 0 8px #fbbf24", "0 0 24px #fbbf24", "0 0 8px #fbbf24"]
                  : ["0 0 8px #ef4444", "0 0 24px #ef4444", "0 0 8px #ef4444"],
              }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              {showResult ? (tie ? "🤝" : "🏆") : "VS"}
            </motion.span>
          </div>

          <BattlePetCard pet={pet2} isWinner={!tie && !p1Wins} isTie={tie} showResult={showResult} />
        </div>

        {/* Winner banner */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="rounded-2xl border glass p-4 text-center flex flex-col gap-1"
              style={{
                borderColor: tie ? "rgba(255,255,255,0.1)" : "rgba(251,191,36,0.25)",
                boxShadow: tie ? undefined : "0 0 32px rgba(251,191,36,0.1)",
              }}
            >
              {tie ? (
                <>
                  <p className="font-pixel text-[9px] text-white/60 tracking-wide">DEAD EVEN</p>
                  <p className="text-xs text-white/35 mt-1">DEAD HEAT. Both developers need to touch grass.</p>
                </>
              ) : (
                <>
                  <p className="font-pixel text-[9px] tracking-wide" style={{ color: "#fbbf24", textShadow: "0 0 12px rgba(251,191,36,0.5)" }}>
                    🏆 {winner!.username} WINS!
                  </p>
                  <p className="text-xs text-white/70 mt-1 italic">{battleCry}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {winner!.data.commitCount30Days} commits vs {loser!.data.commitCount30Days} commits (last 30 days)
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
          <StatRow label="COMMITS" v1={pet1.data.commitCount30Days} v2={pet2.data.commitCount30Days} showResult={showResult} />
          <StatRow label="LEVEL"   v1={l1}  v2={l2}  showResult={showResult} />
          <StatRow label="HEALTH"  v1={h1}  v2={h2}  fmt={(n) => `${n}%`} showResult={showResult} />
          <StatRow label="STREAK"  v1={pet1.data.currentStreak} v2={pet2.data.currentStreak} fmt={(n) => `${n}d`} showResult={showResult} />
          <StatRow label="STARS"   v1={pet1.data.totalStars}    v2={pet2.data.totalStars} showResult={showResult} />
          <StatRow
            label="ENERGY"
            v1={getEnergyPercent(Math.ceil(pet1.data.commitCount30Days * 0.4), Math.ceil(pet1.data.commitCount30Days * 0.3))}
            v2={getEnergyPercent(Math.ceil(pet2.data.commitCount30Days * 0.4), Math.ceil(pet2.data.commitCount30Days * 0.3))}
            fmt={(n) => `${n}%`}
            showResult={showResult}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm text-black btn-summon"
          >
            {copied ? "Copied! 🎉" : "Share Battle 🔥"}
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="px-5 py-2.5 min-h-[44px] rounded-xl text-sm text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
          >
            New Battle
          </motion.button>
        </div>
      </div>
    );
  }

  return null;
}
