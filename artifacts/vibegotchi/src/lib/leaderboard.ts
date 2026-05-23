const KEY = "vibegotchi_leaderboard";

export interface LeaderboardEntry {
  username: string;
  stage: string;
  level: number;
  mood: string;
  petName?: string;
  timestamp: number;
}

export function clearLeaderboard(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

export function saveToLeaderboard(entry: LeaderboardEntry): void {
  try {
    const existing = loadLeaderboard();
    const filtered = existing.filter((e) => e.username !== entry.username);
    const updated = [...filtered, entry]
      .sort((a, b) => b.level - a.level)
      .slice(0, 20);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}
