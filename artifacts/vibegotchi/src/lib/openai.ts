import type { VibeResult } from "@workspace/api-client-react";

function fallbackVibe(commitCount: number, daysSinceLastCommit: number): VibeResult {
  if (daysSinceLastCommit >= 14) {
    return { vibeOneLiner: "Last seen online: archaeologists won't say.", petPersonality: "Ghost", moodBoost: "negative" };
  }
  if (commitCount > 50) {
    return { vibeOneLiner: "This person commits in their sleep. Literally.", petPersonality: "Legendary", moodBoost: "positive" };
  }
  if (commitCount > 20) {
    return { vibeOneLiner: "Steady pace. No drama. Just ships.", petPersonality: "Disciplined", moodBoost: "positive" };
  }
  if (commitCount > 5) {
    return { vibeOneLiner: "WIP energy, but in a charming way.", petPersonality: "Chaotic", moodBoost: "neutral" };
  }
  if (commitCount > 0) {
    return { vibeOneLiner: "Showing up is half the battle. Barely.", petPersonality: "Sleepy", moodBoost: "neutral" };
  }
  return { vibeOneLiner: "The codebase misses you. It's not okay.", petPersonality: "Ghost", moodBoost: "negative" };
}

export async function analyzeVibe(
  commitMessages: string[],
  topLanguage: string,
  commitCount: number,
  daysSinceLastCommit: number
): Promise<VibeResult> {
  try {
    const res = await fetch("/api/vibe/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commitMessages, topLanguage, commitCount, daysSinceLastCommit }),
    });
    if (!res.ok) return fallbackVibe(commitCount, daysSinceLastCommit);
    const data = await res.json();
    if (data.vibeOneLiner && data.petPersonality && data.moodBoost) return data as VibeResult;
    return fallbackVibe(commitCount, daysSinceLastCommit);
  } catch {
    return fallbackVibe(commitCount, daysSinceLastCommit);
  }
}
