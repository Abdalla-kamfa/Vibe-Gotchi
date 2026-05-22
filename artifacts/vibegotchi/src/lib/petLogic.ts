export type PetStage = 'egg' | 'baby' | 'teen' | 'adult' | 'legend';

export function getPetStage(commitCount30Days: number): PetStage {
  if (commitCount30Days === 0) return 'egg';
  if (commitCount30Days <= 5) return 'baby';
  if (commitCount30Days <= 20) return 'teen';
  if (commitCount30Days <= 50) return 'adult';
  return 'legend';
}

export function getPetColors(topLanguage: string) {
  const lang = topLanguage.toLowerCase();
  if (lang === 'python') return { fill: '#7c3aed', accent: '#a78bfa' };
  if (lang === 'javascript' || lang === 'typescript') return { fill: '#eab308', accent: '#fde047' };
  if (lang === 'rust') return { fill: '#ea580c', accent: '#fb923c' };
  if (lang === 'go') return { fill: '#06b6d4', accent: '#67e8f9' };
  return { fill: '#22c55e', accent: '#86efac' };
}

export function getMood(daysSinceLastCommit: number, moodBoost?: 'positive' | 'neutral' | 'negative') {
  let tier = 0;
  if (daysSinceLastCommit <= 1) tier = 4;
  else if (daysSinceLastCommit <= 3) tier = 3;
  else if (daysSinceLastCommit <= 6) tier = 2;
  else if (daysSinceLastCommit <= 13) tier = 1;
  else tier = 0;

  if (moodBoost === 'positive') tier = Math.min(4, tier + 1);
  if (moodBoost === 'negative') tier = Math.max(0, tier - 1);

  switch (tier) {
    case 4: return { emoji: '🔥', label: 'In the zone', tier };
    case 3: return { emoji: '😊', label: 'Vibing', tier };
    case 2: return { emoji: '😐', label: 'Getting rusty', tier };
    case 1: return { emoji: '😴', label: 'Taking a long nap', tier };
    case 0:
    default: return { emoji: '💀', label: 'Please help', tier };
  }
}

export function getLevel(totalRepos: number, totalStars: number): number {
  return Math.floor(Math.sqrt(totalRepos * 10 + totalStars));
}

export function getAccessories(topLanguage: string, totalStars: number, daysSinceLastCommit: number, commitCount30Days: number): string[] {
  const acc: string[] = [];
  const lang = topLanguage.toLowerCase();
  
  if (lang === 'python') acc.push('wizard_hat');
  if (lang === 'javascript' || lang === 'typescript') acc.push('crown');
  if (lang === 'rust') acc.push('shield');
  
  if (totalStars >= 10) acc.push('star_badge');
  if (daysSinceLastCommit === 0 && commitCount30Days > 0) acc.push('fire_aura');
  if (daysSinceLastCommit >= 14) acc.push('skull');
  
  return acc;
}

export function getHealthPercent(daysSinceLastCommit: number): number {
  if (daysSinceLastCommit === 0) return 100;
  if (daysSinceLastCommit >= 14) return 0;
  return Math.max(0, Math.floor(100 - (daysSinceLastCommit / 14) * 100));
}

export function getEnergyPercent(commitsThisWeek: number, commitsLastWeek: number): number {
  if (commitsThisWeek === 0) return 0;
  if (commitsLastWeek === 0) return 100;
  const ratio = commitsThisWeek / commitsLastWeek;
  return Math.min(100, Math.floor(ratio * 50)); // 2x last week = 100%
}
