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
}

export async function fetchGitHubPetData(username: string): Promise<GitHubPetData> {
  const headers = {
    Accept: "application/vnd.github.v3+json",
  };

  const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
  
  if (userRes.status === 404) {
    throw new Error("USER_NOT_FOUND");
  }
  if (userRes.status === 403 || userRes.status === 429) {
    throw new Error("RATE_LIMITED");
  }
  if (!userRes.ok) {
    throw new Error("API_ERROR");
  }

  const user = await userRes.json();

  const [eventsRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=30`, { headers })
  ]);

  if (eventsRes.status === 403 || reposRes.status === 403 || eventsRes.status === 429 || reposRes.status === 429) {
    throw new Error("RATE_LIMITED");
  }

  const events = eventsRes.ok ? await eventsRes.json() : [];
  const repos = reposRes.ok ? await reposRes.json() : [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const pushEvents = events.filter((e: any) => e.type === "PushEvent");
  
  let commitCount30Days = 0;
  let commitsThisWeek = 0;
  let commitsLastWeek = 0;
  const recentCommitMessages: string[] = [];
  const pushDates = new Set<string>();
  
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let lastCommitDate: string | null = null;

  for (const event of pushEvents) {
    const eventDate = new Date(event.created_at);
    if (!lastCommitDate) lastCommitDate = event.created_at;
    
    if (eventDate >= thirtyDaysAgo) {
      const commitCount = event.payload.commits?.length || 0;
      commitCount30Days += commitCount;
      pushDates.add(eventDate.toISOString().split("T")[0]);

      if (eventDate >= oneWeekAgo) {
        commitsThisWeek += commitCount;
      } else if (eventDate >= twoWeeksAgo) {
        commitsLastWeek += commitCount;
      }

      if (event.payload.commits) {
        for (const commit of event.payload.commits) {
          if (recentCommitMessages.length < 5) {
            recentCommitMessages.push(commit.message);
          }
        }
      }
    }
  }

  let daysSinceLastCommit = 999;
  if (lastCommitDate) {
    const lastDate = new Date(lastCommitDate);
    daysSinceLastCommit = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // Check repos for push if no events
    if (repos.length > 0 && repos[0].pushed_at) {
      lastCommitDate = repos[0].pushed_at;
      const lastDate = new Date(repos[0].pushed_at);
      daysSinceLastCommit = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // Calculate streak
  let currentStreak = 0;
  let checkDate = new Date(now);
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (pushDates.has(dateStr) || (currentStreak === 0 && daysSinceLastCommit <= 1)) {
       currentStreak++;
       checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (currentStreak > 0 || daysSinceLastCommit > 1) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Language count
  const langCount: Record<string, number> = {};
  let totalStars = 0;
  for (const repo of repos) {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
    totalStars += repo.stargazers_count || 0;
  }

  let topLanguage = "Default";
  let maxLangCount = 0;
  for (const [lang, count] of Object.entries(langCount)) {
    if (count > maxLangCount) {
      maxLangCount = count;
      topLanguage = lang;
    }
  }

  return {
    username: user.login,
    commitCount30Days,
    lastCommitDate,
    daysSinceLastCommit,
    currentStreak,
    topLanguage,
    totalStars,
    recentCommitMessages,
    totalRepos: user.public_repos || 0
  };
}
