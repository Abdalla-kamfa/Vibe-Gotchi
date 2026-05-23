import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { sounds } from "../lib/sounds";

interface ShareButtonProps {
  level: number;
  stage: string;
  moodEmoji: string;
  moodLabel: string;
}

export function ShareButton({ level, stage, moodEmoji, moodLabel }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = `My VibeGotchi is a Level ${level} ${stage} with ${moodEmoji} ${moodLabel} energy. See yours at vibegotchi.app`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    sounds.sharePop();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.button
      data-testid="button-share"
      onClick={handleShare}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[--neon-green]/40 text-[--neon-green] text-sm font-medium hover:bg-[--neon-green]/10 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied! Go flex on your feed 💚
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share My Pet
        </>
      )}
    </motion.button>
  );
}
