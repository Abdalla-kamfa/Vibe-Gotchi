export type PetStage = "egg" | "baby" | "teen" | "adult" | "legend";

const STAGE_ORDER: PetStage[] = ["egg", "baby", "teen", "adult", "legend"];

/**
 * Stage thresholds (commits in last 30 days):
 *   0       → egg
 *   1–5     → baby
 *   6–20    → teen
 *   21–50   → adult
 *   51+     → legend
 *
 * A high level (≥15) gives a +1 stage boost, but can never override
 * a zero-commit account showing as egg.
 */
export function getPetStage(commitCount30Days: number, level: number = 0): PetStage {
  if (commitCount30Days === 0) return "egg";

  let idx = 1; // at least baby if there are any commits
  if (commitCount30Days > 5)  idx = 2;
  if (commitCount30Days > 20) idx = 3;
  if (commitCount30Days > 50) idx = 4;

  // Level gives a small bonus: ≥15 = +1 stage (capped at legend)
  if (level >= 15) idx = Math.min(4, idx + 1);

  return STAGE_ORDER[idx];
}

export function getPetColors(topLanguage: string) {
  const lang = topLanguage.toLowerCase();
  if (lang === "python")                             return { fill: "#7c3aed", accent: "#a78bfa" };
  if (lang === "javascript" || lang === "typescript") return { fill: "#eab308", accent: "#fde047" };
  if (lang === "rust")                               return { fill: "#ea580c", accent: "#fb923c" };
  if (lang === "go")                                 return { fill: "#06b6d4", accent: "#67e8f9" };
  if (lang === "ruby")                               return { fill: "#e11d48", accent: "#fb7185" };
  if (lang === "java")                               return { fill: "#f97316", accent: "#fdba74" };
  if (lang === "c++" || lang === "c")                return { fill: "#2563eb", accent: "#60a5fa" };
  if (lang === "swift")                              return { fill: "#f43f5e", accent: "#fb7185" };
  if (lang === "kotlin")                             return { fill: "#7c3aed", accent: "#c084fc" };
  if (lang === "php")                                return { fill: "#6366f1", accent: "#a5b4fc" };
  return { fill: "#22c55e", accent: "#86efac" }; // default green
}

export function getMood(daysSinceLastCommit: number, moodBoost?: "positive" | "neutral" | "negative") {
  let tier: number;
  if      (daysSinceLastCommit <= 1)  tier = 4;
  else if (daysSinceLastCommit <= 3)  tier = 3;
  else if (daysSinceLastCommit <= 6)  tier = 2;
  else if (daysSinceLastCommit <= 13) tier = 1;
  else                                 tier = 0;

  if (moodBoost === "positive") tier = Math.min(4, tier + 1);
  if (moodBoost === "negative") tier = Math.max(0, tier - 1);

  switch (tier) {
    case 4:  return { emoji: "🔥", label: "In the zone",       tier };
    case 3:  return { emoji: "😊", label: "Vibing",            tier };
    case 2:  return { emoji: "😐", label: "Getting rusty",     tier };
    case 1:  return { emoji: "😴", label: "Taking a long nap", tier };
    default: return { emoji: "💀", label: "Please help",       tier: 0 };
  }
}

export function getLevel(totalRepos: number, totalStars: number): number {
  return Math.floor(Math.sqrt(totalRepos * 10 + totalStars));
}

export function getAccessories(
  topLanguage: string,
  totalStars: number,
  daysSinceLastCommit: number,
  commitCount30Days: number
): string[] {
  const acc: string[] = [];
  const lang = topLanguage.toLowerCase();

  if (lang === "python")                             acc.push("wizard_hat");
  if (lang === "javascript" || lang === "typescript") acc.push("crown");
  if (lang === "rust")                               acc.push("shield");

  if (totalStars >= 10)                              acc.push("star_badge");
  if (daysSinceLastCommit === 0 && commitCount30Days > 0) acc.push("fire_aura");
  if (daysSinceLastCommit >= 14)                     acc.push("skull");

  return acc;
}

export function getHealthPercent(daysSinceLastCommit: number): number {
  if (daysSinceLastCommit === 0)  return 100;
  if (daysSinceLastCommit >= 14)  return 0;
  return Math.max(0, Math.floor(100 - (daysSinceLastCommit / 14) * 100));
}

export function getEnergyPercent(commitsThisWeek: number, commitsLastWeek: number): number {
  if (commitsThisWeek === 0)  return 0;
  if (commitsLastWeek === 0)  return 100;
  return Math.min(100, Math.floor((commitsThisWeek / commitsLastWeek) * 50));
}
