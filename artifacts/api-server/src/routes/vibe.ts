import { Router } from "express";
import OpenAI from "openai";
import { AnalyzeVibeBody } from "@workspace/api-zod";

const router = Router();

const FALLBACK_VIBES: Record<string, { vibeOneLiner: string; petPersonality: string; moodBoost: string }> = {
  high: { vibeOneLiner: "Commits every day, energy levels: dangerous.", petPersonality: "Legendary", moodBoost: "positive" },
  medium: { vibeOneLiner: "Steady flow, no drama, ships features.", petPersonality: "Disciplined", moodBoost: "neutral" },
  low: { vibeOneLiner: "Git blame says 'not me' but the logs say otherwise.", petPersonality: "Ghost", moodBoost: "negative" },
  chaotic: { vibeOneLiner: "WIP commits at 3am. No tests. Ship it.", petPersonality: "Chaotic", moodBoost: "neutral" },
  sleepy: { vibeOneLiner: "The last commit was a confession, not a feature.", petPersonality: "Sleepy", moodBoost: "negative" },
};

function getFallbackVibe(commitCount: number, daysSinceLastCommit: number) {
  if (daysSinceLastCommit >= 14) return FALLBACK_VIBES.sleepy;
  if (commitCount > 30) return FALLBACK_VIBES.high;
  if (commitCount > 10) return FALLBACK_VIBES.medium;
  if (commitCount === 0) return FALLBACK_VIBES.low;
  return FALLBACK_VIBES.chaotic;
}

router.post("/vibe/analyze", async (req, res) => {
  const parse = AnalyzeVibeBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { commitMessages, topLanguage, commitCount, daysSinceLastCommit } = parse.data;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    req.log.warn("OPENAI_API_KEY not set, using fallback vibe");
    res.json(getFallbackVibe(commitCount, daysSinceLastCommit));
    return;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content: `You are a witty, slightly sarcastic AI that analyzes a developer's GitHub commit history and gives their virtual pet a personality. Based on the commit messages, language, and activity provided, return ONLY a JSON object with these exact fields:
{
  "vibeOneLiner": "string (max 60 chars, punchy, funny, true to their coding style)",
  "petPersonality": "string (one word: Chaotic | Disciplined | Sleepy | Feral | Legendary | Ghost)",
  "moodBoost": "positive | neutral | negative"
}
No markdown. No explanation. JSON only.`,
        },
        {
          role: "user",
          content: JSON.stringify({ commitMessages, topLanguage, commitCount, daysSinceLastCommit }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(raw.trim());

    const valid =
      typeof parsed.vibeOneLiner === "string" &&
      typeof parsed.petPersonality === "string" &&
      ["positive", "neutral", "negative"].includes(parsed.moodBoost);

    if (!valid) throw new Error("Invalid AI response shape");

    res.json({
      vibeOneLiner: parsed.vibeOneLiner.slice(0, 60),
      petPersonality: parsed.petPersonality,
      moodBoost: parsed.moodBoost,
    });
  } catch (err) {
    req.log.error({ err }, "OpenAI vibe analysis failed, using fallback");
    res.json(getFallbackVibe(commitCount, daysSinceLastCommit));
  }
});

export default router;
