# VibeGotchi

A premium consumer webapp where developers paste a public GitHub username and a living virtual pet appears that reacts to their coding activity.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/vibegotchi run dev` — run the frontend (auto-assigned port)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `OPENAI_API_KEY` — for AI vibe analysis (falls back to rule-based if missing)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, wouter routing
- API: Express 5
- Fonts: Google Fonts "Press Start 2P" (pixel aesthetic)
- AI: OpenAI GPT-4o-mini via user-provided OPENAI_API_KEY
- Data: GitHub Public REST API (no auth required)
- State: React useState/useEffect + localStorage for leaderboard

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `artifacts/vibegotchi/src/` — React frontend
  - `lib/github.ts` — GitHub API fetching + all data calculations
  - `lib/petLogic.ts` — pure pet stage/mood/accessory calculation functions
  - `lib/openai.ts` — AI vibe call with graceful fallback
  - `lib/leaderboard.ts` — localStorage save/load
  - `components/PetSprite.tsx` — animated SVG creature (5 stages × language colors)
  - `components/StatsPanel.tsx` — RPG stat card with animated progress bars
  - `components/MoodBadge.tsx` — animated mood display
  - `components/ShareButton.tsx` — clipboard copy + feedback toast
  - `components/LoadingEgg.tsx` — animated loading state
  - `components/LeaderboardRow.tsx` — leaderboard entry row
  - `pages/Home.tsx` — full single-page experience (input → loading → pet display)
  - `pages/Leaderboard.tsx` — session leaderboard from localStorage
- `artifacts/api-server/src/routes/vibe.ts` — POST /api/vibe/analyze (OpenAI + fallback)

## Architecture decisions

- GitHub API called directly from frontend (public endpoints, no CORS issues)
- Backend only needed for OpenAI calls (keeps API key server-side)
- Leaderboard stored in localStorage — no auth, no server, works offline
- AI vibe analysis always has a rule-based fallback — never errors to user
- Animated SVG pets built inline — no images, no external assets, fully portable

## Product

- Paste any public GitHub username → animated virtual pet appears
- Pet stage (egg/baby/teen/adult/legend) based on commits in last 30 days
- Pet color based on top programming language (Python=purple, JS=yellow, Rust=orange, Go=cyan)
- Accessory overlays (wizard hat, crown, shield, star badge, fire aura, skull)
- Mood system (🔥 In the zone → 💀 Please help) based on days since last commit
- AI-generated "vibe" personality from commit message analysis
- Animated progress bar stats: Health, Energy, Fed, Streak, Level
- Share button copies shareable text to clipboard
- Session leaderboard persists across page refreshes

## User preferences

- Uses OPENAI_API_KEY secret (user's own key, not Replit AI Integrations)
- Dark theme only, no white backgrounds
- Mobile-first at 375px

## Gotchas

- `font-pixel` and `bg-space` are custom CSS classes defined in `index.css` (not Tailwind utilities)
- Always run codegen after changing `lib/api-spec/openapi.yaml`
- Google Fonts `@import url(...)` must be the FIRST line of `index.css`
- GitHub public API has rate limits (~60 req/hr per IP without a token); set `GITHUB_TOKEN` env var to increase

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
