export interface VibeLine {
  oneLiner: string;
  personality: string;
  moodBoost: "positive" | "neutral" | "negative";
}

export const VIBE_LINES_LEGEND: VibeLine[] = [
  { oneLiner: "Commits at 2am and calls it 'minor fixes'", personality: "Night Owl", moodBoost: "positive" },
  { oneLiner: "Types fast, thinks faster, documents never", personality: "Velocity Demon", moodBoost: "positive" },
  { oneLiner: "This account is basically a CI pipeline with a GitHub avatar", personality: "The Machine", moodBoost: "positive" },
  { oneLiner: "Force pushes to main with confidence. No regrets, no survivors.", personality: "Chaos Engine", moodBoost: "positive" },
  { oneLiner: "The CI pipeline has a shrine dedicated to this person", personality: "Legendary", moodBoost: "positive" },
  { oneLiner: "Probably has a commit cron job running. We can't prove it.", personality: "Automation Wizard", moodBoost: "positive" },
  { oneLiner: "Ship it. Fix it in prod. Call it an A/B test.", personality: "Move Fast", moodBoost: "positive" },
];

export const VIBE_LINES_ADULT: VibeLine[] = [
  { oneLiner: "Steady pace. No drama. Just ships.", personality: "The Shipper", moodBoost: "positive" },
  { oneLiner: "Opens 12 tabs of Stack Overflow simultaneously", personality: "Tab Hoarder", moodBoost: "positive" },
  { oneLiner: "PRs raised on vibes, merged on prayers", personality: "Vibes Engineer", moodBoost: "positive" },
  { oneLiner: "Lives on the main branch. It's a choice. A bold one.", personality: "Main Branch Rider", moodBoost: "neutral" },
  { oneLiner: "Closes issues by opening new issues about the issues", personality: "Issue Farmer", moodBoost: "neutral" },
  { oneLiner: "The kind of dev who says 'works on my machine' with their whole chest", personality: "Pragmatist", moodBoost: "neutral" },
  { oneLiner: "Git log is a poem nobody asked for but everyone respects", personality: "The Poet", moodBoost: "positive" },
];

export const VIBE_LINES_TEEN: VibeLine[] = [
  { oneLiner: "WIP energy, but in a charming way", personality: "The Hustler", moodBoost: "neutral" },
  { oneLiner: "Git history is a crime scene, but the detective quit", personality: "Chaotic Good", moodBoost: "neutral" },
  { oneLiner: "README? Never heard of her.", personality: "Undocumented", moodBoost: "neutral" },
  { oneLiner: "Half the commits are 'fix', the other half are 'fix fix'", personality: "Iterative", moodBoost: "neutral" },
  { oneLiner: "Writes TODO with the energy of someone who will absolutely never return", personality: "The Optimist", moodBoost: "neutral" },
  { oneLiner: "Deletes node_modules to fix problems. Every time.", personality: "Nuclear Debug", moodBoost: "neutral" },
];

export const VIBE_LINES_BABY: VibeLine[] = [
  { oneLiner: "Showing up is half the battle. Barely.", personality: "The Beginner", moodBoost: "neutral" },
  { oneLiner: "Every line of code is a prayer to the runtime gods", personality: "The Hopeful", moodBoost: "neutral" },
  { oneLiner: "Ship first, test never, explain later", personality: "YOLO Dev", moodBoost: "neutral" },
  { oneLiner: "Copy-pasting from Stack Overflow is a valid architecture", personality: "The Pragmatist", moodBoost: "neutral" },
  { oneLiner: "Code works, nobody knows why, moving on", personality: "Mysterious", moodBoost: "neutral" },
];

export const VIBE_LINES_GHOST: VibeLine[] = [
  { oneLiner: "Last seen online: archaeologists are investigating", personality: "Ghost", moodBoost: "negative" },
  { oneLiner: "The codebase misses them. It's not okay.", personality: "The Missing", moodBoost: "negative" },
  { oneLiner: "GitHub profile technically exists. That's the most positive thing we can say.", personality: "The Absent", moodBoost: "negative" },
  { oneLiner: "The last commit message was 'final final FINAL v2 (THIS ONE)'", personality: "The Lost", moodBoost: "negative" },
  { oneLiner: "We lit a candle for the unmerged PRs", personality: "The Dormant", moodBoost: "negative" },
  { oneLiner: "Closed issues by deleting the repo. Twice. Peace.", personality: "Nuclear Option", moodBoost: "negative" },
  { oneLiner: "On sabbatical. From coding. Indefinitely.", personality: "On Leave", moodBoost: "negative" },
];
