# VibeGotchi 🐾

> Your GitHub commits. Your creature. Don't let it die.

![VibeGotchi Landing](https://vibegotchi.vercel.app/og-image.png)

## 🌐 Live Demo
**[vibegotchi.vercel.app](https://vibegotchi.vercel.app)**

Try these usernames: `torvalds` · `sindresorhus` · `wesbos` · `roastme`

---

## What Is VibeGotchi?

VibeGotchi turns your GitHub activity into a living virtual pet.
Ship code and it thrives. Ghost your repos and it dies.
No login. No signup. Just paste a username.



---

## Features

### 🐾 Live GitHub Pet
Paste any public GitHub username → animated creature appears instantly.
Evolves through 5 stages based on real commit data:

| Stage | Commits (30 days) | Look |
|-------|------------------|------|
| 💀 Ghost | 0 | Grey, skull overlay, flickering |
| 🥚 Egg | 1-5 | Small, wobbly, curious |
| 🧒 Teen | 6-20 | Medium, energetic |
| 💪 Adult | 21-50 | Full size, confident glow |
| 👑 Legend | 51+ | Golden glow, crown, particles |

### 🤖 AI Vibe Analysis
GPT-4o-mini reads your last 5 commit messages and generates
a unique personality line. Every developer gets a different read.

*"Commits at 2am and calls it minor fixes"*
*"Git history is a crime scene"*
*"Force pushes to main with confidence"*

### ⚔️ Battle Mode
Enter two GitHub usernames. Both pets load simultaneously.
Stats compare live. Winner gets a crown. Loser gets a skull.
Funny battle cry generated based on the commit gap.

### 👗 Outfit Unlocks
Pet automatically wears accessories based on your stack:

| Language | Accessory |
|----------|-----------|
| Python | 🧙 Wizard hat |
| JavaScript | 👑 Crown |
| TypeScript | 🎩 Top hat |
| Rust | 🛡️ Shield |
| Active today | 🔥 Fire aura |
| 14+ days idle | 💀 Skull |

### 📊 RPG Stats Panel
- ❤️ Health — recency of last commit
- ⚡ Energy — this week vs last week ratio
- 🍕 Fed — total commits in 30 days
- 🔥 Streak — consecutive active days
- 🏆 Level — repos + stars formula
- 💬 Vibe — AI personality line

### 😄 Mood System
- 🔥 In the zone — committed today
- 😊 Vibing — 2-3 days ago
- 😐 Getting rusty — 4-6 days ago
- 😴 Long nap — 7-13 days ago
- 💀 Please help — 14+ days ago

### 🏆 Hall of Legends
Every pet summoned appears in the leaderboard at `/leaderboard`.
Ranked by level. Top 3 get gold/silver/bronze treatment.
Persists across page refreshes.

### 📤 Share Your Pet
One click copies a shareable message to clipboard.
Designed for Twitter/X and Discord.

### 🔄 Live Auto-Refresh
Pet stats silently refresh every 30 seconds.
Commit to GitHub while watching — your pet reacts in real time.

### 🎭 Easter Egg
Type `roastme` as the username for a surprise 👀

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Vite + React 19 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Data | GitHub Public REST API |
| AI | OpenAI GPT-4o-mini |
| Fonts | Press Start 2P + Inter |
| Deployment | Vercel |
| Storage | localStorage |


## License
MIT

---
