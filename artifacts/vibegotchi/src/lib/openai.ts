import type { VibeResult } from "@workspace/api-client-react";
import {
  VIBE_LINES_LEGEND,
  VIBE_LINES_ADULT,
  VIBE_LINES_TEEN,
  VIBE_LINES_BABY,
  VIBE_LINES_GHOST,
  type VibeLine,
} from "../constants/vibeLines";

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function msgHash(messages: string[]): number {
  return messages.reduce((h, m) => {
    for (let i = 0; i < m.length; i++) h = Math.imul(h ^ m.charCodeAt(i), 0x9e3779b9);
    return h >>> 0;
  }, 2166136261);
}

function fallbackVibe(
  commitMessages: string[],
  commitCount: number,
  daysSinceLastCommit: number
): VibeResult {
  const seed = msgHash(commitMessages) + commitCount * 7 + daysSinceLastCommit * 3;

  let pool: VibeLine[];
  if (commitCount === 0 || daysSinceLastCommit >= 14) {
    pool = VIBE_LINES_GHOST;
  } else if (commitCount > 50) {
    pool = VIBE_LINES_LEGEND;
  } else if (commitCount > 20) {
    pool = VIBE_LINES_ADULT;
  } else if (commitCount > 5) {
    pool = VIBE_LINES_TEEN;
  } else {
    pool = VIBE_LINES_BABY;
  }

  const chosen = pick(pool, seed);
  return {
    vibeOneLiner: chosen.oneLiner,
    petPersonality: chosen.personality,
    moodBoost: chosen.moodBoost,
  };
}

export async function analyzeVibe(
  commitMessages: string[],
  topLanguage: string,
  commitCount: number,
  daysSinceLastCommit: number
): Promise<VibeResult> {
  const fb = () => fallbackVibe(commitMessages, commitCount, daysSinceLastCommit);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let res: Response;
    try {
      res = await fetch("/api/vibe/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessages, topLanguage, commitCount, daysSinceLastCommit }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) return fb();
    const data: unknown = await res.json();
    if (
      data !== null &&
      typeof data === "object" &&
      "vibeOneLiner" in data &&
      "petPersonality" in data &&
      "moodBoost" in data
    ) {
      return data as VibeResult;
    }
    return fb();
  } catch {
    return fb();
  }
}
