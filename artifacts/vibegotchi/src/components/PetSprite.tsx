import { motion } from "framer-motion";
import type { PetStage } from "../lib/petLogic";

interface PetSpriteProps {
  stage: PetStage;
  colors: { fill: string; accent: string };
  accessories: string[];
}

function ParticleEffect({ color }: { color: string }) {
  const particles = Array.from({ length: 8 }, (_, i) => i);
  return (
    <g>
      {particles.map((i) => {
        const angle = (i / 8) * 360;
        const rad = (angle * Math.PI) / 180;
        const r = 85;
        const cx = 100 + r * Math.cos(rad);
        const cy = 110 + r * Math.sin(rad);
        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r={4}
            fill={color}
            animate={{
              r: [3, 5, 3],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </g>
  );
}

function EggPet({ colors }: { colors: { fill: string; accent: string } }) {
  return (
    <g>
      <ellipse cx="100" cy="115" rx="52" ry="64" fill={colors.fill} opacity="0.3" />
      <ellipse cx="100" cy="112" rx="48" ry="60" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />
      <path d="M88 76 L93 92 L86 102 L96 118" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M110 80 L106 94 L112 106" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <motion.g animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }} style={{ transformOrigin: "100px 110px" }}>
        <ellipse cx="84" cy="109" rx="6" ry="7" fill="#1a1a2e" />
        <ellipse cx="116" cy="109" rx="6" ry="7" fill="#1a1a2e" />
        <circle cx="82" cy="107" r="2.5" fill="white" opacity="0.6" />
        <circle cx="114" cy="107" r="2.5" fill="white" opacity="0.6" />
      </motion.g>
      <path d="M88 128 Q100 122 112 128" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </g>
  );
}

function BabyPet({ colors }: { colors: { fill: string; accent: string } }) {
  return (
    <g>
      <ellipse cx="100" cy="120" rx="42" ry="38" fill={colors.fill} opacity="0.15" />
      <ellipse cx="100" cy="118" rx="38" ry="34" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />
      <motion.g
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 118px" }}
      >
        <ellipse cx="65" cy="112" rx="12" ry="9" fill={colors.fill} stroke={colors.accent} strokeWidth="1.5" />
        <ellipse cx="135" cy="112" rx="12" ry="9" fill={colors.fill} stroke={colors.accent} strokeWidth="1.5" />
      </motion.g>
      <motion.g animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5 }} style={{ transformOrigin: "100px 115px" }}>
        <circle cx="88" cy="113" r="7" fill="#1a1a2e" />
        <circle cx="112" cy="113" r="7" fill="#1a1a2e" />
        <circle cx="86" cy="111" r="3" fill="white" opacity="0.7" />
        <circle cx="110" cy="111" r="3" fill="white" opacity="0.7" />
      </motion.g>
      <ellipse cx="83" cy="121" r="5" fill={colors.accent} opacity="0.3" />
      <ellipse cx="117" cy="121" r="5" fill={colors.accent} opacity="0.3" />
      <path d="M90 130 Q100 136 110 130" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
  );
}

function TeenPet({ colors }: { colors: { fill: string; accent: string } }) {
  return (
    <g>
      <ellipse cx="100" cy="105" rx="46" ry="56" fill={colors.fill} opacity="0.12" />
      <ellipse cx="100" cy="103" rx="40" ry="50" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />
      <rect x="60" y="110" width="14" height="26" rx="7" fill={colors.fill} stroke={colors.accent} strokeWidth="1.5" />
      <rect x="126" y="110" width="14" height="26" rx="7" fill={colors.fill} stroke={colors.accent} strokeWidth="1.5" />
      <rect x="74" y="138" width="12" height="22" rx="6" fill={colors.fill} stroke={colors.accent} strokeWidth="1.5" />
      <rect x="114" y="138" width="12" height="22" rx="6" fill={colors.fill} stroke={colors.accent} strokeWidth="1.5" />
      <motion.g animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 1.8 }} style={{ transformOrigin: "100px 100px" }}>
        <circle cx="87" cy="98" r="8" fill="#1a1a2e" />
        <circle cx="113" cy="98" r="8" fill="#1a1a2e" />
        <circle cx="84" cy="95" r="3" fill="white" opacity="0.8" />
        <circle cx="110" cy="95" r="3" fill="white" opacity="0.8" />
      </motion.g>
      <path d="M90 116 Q100 122 110 116" stroke={colors.accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M83 88 Q87 82 100 82 Q113 82 117 88" stroke={colors.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </g>
  );
}

function AdultPet({ colors }: { colors: { fill: string; accent: string } }) {
  return (
    <g>
      <motion.ellipse
        cx="100" cy="100" rx="60" ry="72"
        fill={colors.accent}
        animate={{ opacity: [0.04, 0.12, 0.04] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <ellipse cx="100" cy="98" rx="48" ry="58" fill={colors.fill} stroke={colors.accent} strokeWidth="2.5" />
      <rect x="52" y="104" width="16" height="32" rx="8" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />
      <rect x="132" y="104" width="16" height="32" rx="8" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />
      <rect x="68" y="144" width="14" height="26" rx="7" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />
      <rect x="118" y="144" width="14" height="26" rx="7" fill={colors.fill} stroke={colors.accent} strokeWidth="2" />
      <motion.g animate={{ scaleY: [1, 0.08, 1] }} transition={{ duration: 4, repeat: Infinity, repeatDelay: 2.5 }} style={{ transformOrigin: "100px 95px" }}>
        <circle cx="86" cy="93" r="10" fill="#0a0a18" />
        <circle cx="114" cy="93" r="10" fill="#0a0a18" />
        <circle cx="82" cy="89" r="4" fill="white" opacity="0.9" />
        <circle cx="110" cy="89" r="4" fill="white" opacity="0.9" />
        <circle cx="83" cy="89" r="1.5" fill={colors.accent} opacity="0.8" />
        <circle cx="111" cy="89" r="1.5" fill={colors.accent} opacity="0.8" />
      </motion.g>
      <path d="M87 114 Q100 122 113 114" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M82 76 Q86 66 100 65 Q114 66 118 76" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
    </g>
  );
}

function LegendPet({ colors }: { colors: { fill: string; accent: string } }) {
  return (
    <g>
      <motion.ellipse
        cx="100" cy="100" rx="72" ry="84"
        fill="#fbbf24"
        animate={{ opacity: [0.03, 0.1, 0.03] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.ellipse
        cx="100" cy="100" rx="60" ry="72"
        fill="#f59e0b"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
      />
      <ellipse cx="100" cy="96" rx="50" ry="62" fill={colors.fill} stroke="#fbbf24" strokeWidth="3" />
      <rect x="48" y="102" width="17" height="35" rx="8.5" fill={colors.fill} stroke="#fbbf24" strokeWidth="2" />
      <rect x="135" y="102" width="17" height="35" rx="8.5" fill={colors.fill} stroke="#fbbf24" strokeWidth="2" />
      <rect x="65" y="148" width="15" height="28" rx="7.5" fill={colors.fill} stroke="#fbbf24" strokeWidth="2" />
      <rect x="120" y="148" width="15" height="28" rx="7.5" fill={colors.fill} stroke="#fbbf24" strokeWidth="2" />
      <motion.g animate={{ scaleY: [1, 0.06, 1] }} transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 3 }} style={{ transformOrigin: "100px 90px" }}>
        <circle cx="85" cy="88" r="12" fill="#0a0a18" />
        <circle cx="115" cy="88" r="12" fill="#0a0a18" />
        <circle cx="80" cy="83" r="5" fill="white" opacity="0.95" />
        <circle cx="110" cy="83" r="5" fill="white" opacity="0.95" />
        <motion.circle cx="81" cy="84" r="2" fill="#fbbf24" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} />
        <motion.circle cx="111" cy="84" r="2" fill="#fbbf24" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity, delay: 0.5 }} />
      </motion.g>
      <path d="M85 112 Q100 122 115 112" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* Crown */}
      <g transform="translate(72, 20)">
        <polygon points="28,0 56,0 50,28 40,18 28,28 16,18 0,28" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
        <circle cx="28" cy="3" r="4" fill="#fbbf24" />
        <circle cx="56" cy="3" r="4" fill="#fbbf24" />
        <circle cx="28" cy="3" r="2" fill="white" opacity="0.8" />
        <circle cx="56" cy="3" r="2" fill="white" opacity="0.8" />
      </g>
      <ParticleEffect color="#fbbf24" />
    </g>
  );
}

function AccessoryOverlay({ accessories, stage }: { accessories: string[]; stage: PetStage }) {
  const large = stage === "adult" || stage === "legend";
  const cy = large ? 35 : 50;
  return (
    <g>
      {accessories.includes("wizard_hat") && (
        <g transform={`translate(${large ? 62 : 70}, ${cy - 22})`}>
          <polygon points="18,0 36,38 0,38" fill="#7c3aed" stroke="#a78bfa" strokeWidth="1.5" />
          <rect x="-4" y="32" width="44" height="10" rx="5" fill="#5b21b6" stroke="#a78bfa" strokeWidth="1" />
          <circle cx="18" cy="6" r="3" fill="#fde047" opacity="0.9" />
        </g>
      )}
      {accessories.includes("crown") && !accessories.includes("wizard_hat") && stage !== "legend" && (
        <g transform={`translate(${large ? 70 : 76}, ${cy - 20})`}>
          <polygon points="20,0 40,0 36,20 28,13 20,20 12,13 0,20" fill="#eab308" stroke="#fde047" strokeWidth="1.5" />
          <circle cx="20" cy="3" r="3" fill="#fde047" />
          <circle cx="40" cy="3" r="3" fill="#fde047" />
        </g>
      )}
      {accessories.includes("shield") && (
        <g transform={`translate(${large ? 142 : 136}, 100)`}>
          <path d="M0,0 L18,0 L18,24 L9,30 L0,24 Z" fill="#ea580c" stroke="#fb923c" strokeWidth="1.5" />
          <path d="M4,6 L14,6 L14,22 L9,26 L4,22 Z" fill="#7c2d12" opacity="0.5" />
          <line x1="9" y1="4" x2="9" y2="24" stroke="#fb923c" strokeWidth="1.5" />
          <line x1="3" y1="14" x2="15" y2="14" stroke="#fb923c" strokeWidth="1.5" />
        </g>
      )}
      {accessories.includes("star_badge") && (
        <g transform={`translate(${large ? 56 : 62}, 100)`}>
          <polygon points="9,0 11,6 18,6 12,10 14,17 9,13 4,17 6,10 0,6 7,6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
        </g>
      )}
      {accessories.includes("fire_aura") && (
        <motion.g
          animate={{ opacity: [0.5, 1, 0.5], scaleY: [1, 1.1, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ transformOrigin: "100px 160px" }}
        >
          {[80, 90, 100, 110, 120].map((x, i) => (
            <motion.path
              key={i}
              d={`M${x},175 Q${x - 4},162 ${x},150 Q${x + 4},160 ${x + 2},175`}
              fill="#f97316"
              opacity="0.7"
              animate={{ d: [`M${x},175 Q${x - 4},162 ${x},150 Q${x + 4},160 ${x + 2},175`, `M${x},175 Q${x + 3},160 ${x},148 Q${x - 3},158 ${x - 2},175`] }}
              transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, repeatType: "reverse" }}
            />
          ))}
        </motion.g>
      )}
      {accessories.includes("skull") && (
        <motion.g
          animate={{ opacity: [1, 0.2, 0.8, 0.1, 1], x: [-1, 1, -1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          <circle cx="100" cy="42" r="18" fill="#1e1e2e" stroke="#ef4444" strokeWidth="2" />
          <circle cx="93" cy="39" r="5" fill="#ef4444" opacity="0.8" />
          <circle cx="107" cy="39" r="5" fill="#ef4444" opacity="0.8" />
          <path d="M90 52 L95 52 L95 56 L93 56 L93 52 M100 52 L100 56 M105 52 L110 52 L110 56 L107 56 L107 52" stroke="#ef4444" strokeWidth="1.5" fill="none" />
        </motion.g>
      )}
    </g>
  );
}

export function PetSprite({ stage, colors, accessories }: PetSpriteProps) {
  return (
    <motion.div
      data-testid="pet-sprite"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="flex items-center justify-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible" }}
        >
          {stage === "egg" && <EggPet colors={colors} />}
          {stage === "baby" && <BabyPet colors={colors} />}
          {stage === "teen" && <TeenPet colors={colors} />}
          {stage === "adult" && <AdultPet colors={colors} />}
          {stage === "legend" && <LegendPet colors={colors} />}
          <AccessoryOverlay accessories={accessories} stage={stage} />
        </svg>
      </motion.div>
    </motion.div>
  );
}
