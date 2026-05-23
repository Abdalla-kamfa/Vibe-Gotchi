export interface GitHubPetData {
  username: string;
  commitCount30Days: number;
  lastCommitDate: string | null;
  daysSinceLastCommit: number;
  currentStreak: number;
  topLanguage: string;
  totalStars: number;
  recentCommitMessages: string[];
  totalRepos: number;
  fromCache?: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedData(key: string): GitHubPetData | null {
  try {
    const raw = sessionStorage.getItem(`vg_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: GitHubPetData; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(`vg_${key}`); return null; }
    return data;
  } catch { return null; }
}

function setCachedData(key: string, data: GitHubPetData): void {
  try { sessionStorage.setItem(`vg_${key}`, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

interface GHCommit {
  message: string;
}

interface GHEvent {
  type: string;
  created_at: string;
  payload: { commits?: GHCommit[] };
}

interface GHRepo {
  language: string | null;
  stargazers_count: number;
  pushed_at: string | null;
}

interface GHUser {
  login: string;
  public_repos: number;
}

function buildHeaders(): Record<string, string> {
  const token = import.meta.env["VITE_GITHUB_TOKEN"] as string | undefined;
  const base: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    base["Authorization"] = `token ${token}`;
  }
  return base;
}

function checkRateLimit(res: Response): void {
  if (res.status === 403 || res.status === 429) {
    throw new Error("RATE_LIMITED");
  }
}

export async function fetchGitHubPetData(
  username: string,
  signal?: AbortSignal
): Promise<GitHubPetData> {
  const cacheKey = username.toLowerCase();
  const cached = getCachedData(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const headers = buildHeaders();
  const opts: RequestInit = { headers, signal };

  const userRes = await fetch(`https://api.github.com/users/${username}`, opts);

  if (userRes.status === 404) throw new Error("USER_NOT_FOUND");
  checkRateLimit(userRes);
  if (!userRes.ok) throw new Error("API_ERROR");

  const user = (await userRes.json()) as GHUser;

  const [eventsRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, opts),
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, opts),
  ]);

  checkRateLimit(eventsRes);
  checkRateLimit(reposRes);

  const events: GHEvent[] = eventsRes.ok ? (await eventsRes.json()) as GHEvent[] : [];
  const repos: GHRepo[]   = reposRes.ok  ? (await reposRes.json())  as GHRepo[]  : [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneWeekAgo    = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo   = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const pushEvents = events.filter((e) => e.type === "PushEvent");

  let commitCount30Days = 0;
  let commitsThisWeek   = 0;
  let commitsLastWeek   = 0;
  let lastCommitDate: string | null = null;
  const recentCommitMessages: string[] = [];
  const pushDates = new Set<string>();

  for (const event of pushEvents) {
    const eventDate = new Date(event.created_at);
    if (!lastCommitDate) lastCommitDate = event.created_at;

    if (eventDate >= thirtyDaysAgo) {
      const count = event.payload.commits?.length ?? 0;
      commitCount30Days += count;
      pushDates.add(eventDate.toISOString().split("T")[0]);

      if (eventDate >= oneWeekAgo)    commitsThisWeek  += count;
      else if (eventDate >= twoWeeksAgo) commitsLastWeek += count;

      if (event.payload.commits) {
        for (const commit of event.payload.commits) {
          if (recentCommitMessages.length < 5) recentCommitMessages.push(commit.message);
        }
      }
    }
  }

  let daysSinceLastCommit = 999;
  if (lastCommitDate) {
    daysSinceLastCommit = Math.floor(
      (now.getTime() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
    );
  } else if (repos.length > 0 && repos[0].pushed_at) {
    lastCommitDate = repos[0].pushed_at;
    daysSinceLastCommit = Math.floor(
      (now.getTime() - new Date(repos[0].pushed_at).getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Streak: count consecutive days with pushes going backwards from today
  let currentStreak = 0;
  const checkDate = new Date(now);
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (pushDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0 && daysSinceLastCommit <= 1) {
      // If last commit was today/yesterday but not captured in push events, skip forward
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Language frequency
  const langCount: Record<string, number> = {};
  let totalStars = 0;
  for (const repo of repos) {
    if (repo.language) langCount[repo.language] = (langCount[repo.language] ?? 0) + 1;
    totalStars += repo.stargazers_count ?? 0;
  }

  let topLanguage = "Default";
  let maxCount = 0;
  for (const [lang, count] of Object.entries(langCount)) {
    if (count > maxCount) { maxCount = count; topLanguage = lang; }
  }

  // Unused but kept for potential future use
  void commitsThisWeek;
  void commitsLastWeek;

  const result: GitHubPetData = {
    username: user.login,
    commitCount30Days,
    lastCommitDate,
    daysSinceLastCommit,
    currentStreak,
    topLanguage,
    totalStars,
    recentCommitMessages,
    totalRepos: user.public_repos ?? 0,
  };
  setCachedData(cacheKey, result);
  return result;
}
