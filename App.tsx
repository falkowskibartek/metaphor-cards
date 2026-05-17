import { useState, useRef } from "react";
import { motion } from "framer-motion";

type Card = { id: number; img: string };
type Pos = { rotate: number; y: number };
type Phase = "idle" | "gather" | "spread";

const ALL_CARDS: Card[] = [
  { id: 1,  img: "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=400" },
  { id: 2,  img: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400" },
  { id: 3,  img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400" },
  { id: 4,  img: "https://images.unsplash.com/photo-1511497584788-876760111969?w=400" },
  { id: 5,  img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400" },
  { id: 6,  img: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=400" },
  { id: 7,  img: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400" },
  { id: 8,  img: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400" },
  { id: 9,  img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400" },
  { id: 10, img: "https://images.unsplash.com/photo-1414490929659-9a12b7e31907?w=400" },
  { id: 11, img: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400" },
  { id: 12, img: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400" },
  { id: 13, img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400" },
  { id: 14, img: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400" },
  { id: 15, img: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400" },
  { id: 16, img: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400" },
  { id: 17, img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400" },
  { id: 18, img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400" },
];

const N       = ALL_CARDS.length;
const CARD_W  = 112;
const CARD_H  = 182;
const OVERLAP = 36;
const SPREAD_W = (N - 1) * OVERLAP + CARD_W; // 713 px

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genPositions(): Pos[] {
  return Array.from({ length: N }, () => ({
    rotate: (Math.random() - 0.5) * 18,
    y:      (Math.random() - 0.5) * 14,
  }));
}

function CardBack() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(150deg, #2d1b4e 0%, #120828 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "76%",
          height: "80%",
          border: "1.5px solid rgba(255,215,0,0.22)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="44" height="44" viewBox="0 0 60 60" style={{ opacity: 0.28 }}>
          <polygon
            points="30,2 36,20 56,20 40,32 46,52 30,40 14,52 20,32 4,20 24,20"
            fill="none" stroke="gold" strokeWidth="1.5"
          />
          <circle cx="30" cy="30" r="7" fill="none" stroke="gold" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [spread, setSpread]       = useState<Card[]>(() => shuffleArr(ALL_CARDS));
  const [positions, setPositions] = useState<Pos[]>(() => genPositions());
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [hoveredId, setHoveredId]   = useState<number | null>(null);
  const [phase, setPhase]           = useState<Phase>("idle");

  // Per-card stable random gather offsets — computed once on mount
  const gatherOffsets = useRef(
    new Map(
      ALL_CARDS.map((c) => [
        c.id,
        {
          dx: (Math.random() - 0.5) * 38,
          dy: (Math.random() - 0.5) * 22,
          dr: (Math.random() - 0.5) * 14,
        },
      ])
    )
  );

  const centerX = (SPREAD_W - CARD_W) / 2;

  // Click directly on any card → toggle its revealed state
  const handleCardClick = (card: Card) => {
    if (phase !== "idle") return;
    setRevealedId((prev) => (prev === card.id ? null : card.id));
  };

  // "Wylosuj kartę" → reveal a random card (different from the current one)
  const drawRandom = () => {
    if (phase !== "idle") return;
    const eligible = spread.filter((c) => c.id !== revealedId);
    if (!eligible.length) return;
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    setRevealedId(pick.id);
  };

  const doShuffle = () => {
    if (phase !== "idle") return;
    setRevealedId(null);
    setHoveredId(null);
    setPhase("gather");

    setTimeout(() => {
      setSpread(shuffleArr(ALL_CARDS));
      setPositions(genPositions());
      setPhase("spread");
      setTimeout(() => setPhase("idle"), 1050);
    }, 800);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 52,
        background: "radial-gradient(ellipse at 50% 45%, #1c0d35, #040008 80%)",
        padding: "24px 48px",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 44, fontFamily: "Georgia, serif", color: "#fde68a", margin: 0, letterSpacing: "0.04em" }}>
          Magiczne Karty
        </h1>
        <p style={{ opacity: 0.3, letterSpacing: "0.3em", textTransform: "uppercase", fontSize: 10, margin: "8px 0 0" }}>
          Zaufaj intuicji
        </p>
      </div>

      {/* Card spread */}
      <div
        style={{
          position: "relative",
          width: SPREAD_W,
          // Extra top space so lifted/scaled cards aren't clipped
          height: CARD_H + 80,
          overflow: "visible",
        }}
      >
        {spread.map((card, index) => {
          const pos       = positions[index];
          const isRevealed = card.id === revealedId;
          const isHovered  = card.id === hoveredId && !isRevealed && phase === "idle";
          const go         = gatherOffsets.current.get(card.id)!;

          // Cards further from center start gathering slightly later so they
          // arrive together — natural "sweeping" motion
          const distFrac    = Math.abs(index - (N - 1) / 2) / ((N - 1) / 2);
          const gatherDelay = (1 - distFrac) * 0.12;
          const spreadDelay = index * 0.035;

          return (
            <motion.div
              key={card.id}
              style={{
                position: "absolute",
                left: 0,
                top: 40,            // baseline; extra top space absorbs upward lift
                width: CARD_W,
                height: CARD_H,
                zIndex:  isRevealed ? 1000 : isHovered ? 500 : index,
                cursor:  phase === "idle" ? "pointer" : "default",
              }}
              onClick={() => handleCardClick(card)}
              onMouseEnter={() => { if (phase === "idle") setHoveredId(card.id); }}
              onMouseLeave={() => setHoveredId(null)}
              animate={
                phase === "gather"
                  ? { x: centerX + go.dx, y: go.dy, rotate: go.dr, scale: 1 }
                  : {
                      x:      index * OVERLAP,
                      // Revealed card lifts high enough to clear neighbouring cards
                      y:      isRevealed ? pos.y - 50 : isHovered ? pos.y - 18 : pos.y,
                      scale:  isRevealed ? 1.22       : isHovered ? 1.06        : 1,
                      // Straighten when revealed so the image isn't tilted
                      rotate: isRevealed ? 0 : pos.rotate,
                    }
              }
              transition={
                phase === "gather"
                  ? { delay: gatherDelay, duration: 0.55, ease: "easeInOut" }
                  : phase === "spread"
                  ? { delay: spreadDelay, duration: 0.7, type: "spring", stiffness: 105, damping: 17 }
                  : { type: "spring", stiffness: 260, damping: 24 }
              }
            >
              {/* ── 3-D flip ─────────────────────────────────────────────── */}
              <div style={{ width: "100%", height: "100%", perspective: 1000 }}>
                <motion.div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    borderRadius: 12,
                  }}
                  animate={{ rotateY: isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.74, ease: [0.4, 0, 0.15, 1] }}
                >
                  {/* Back face */}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      borderRadius: 12, overflow: "hidden",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
                    }}
                  >
                    <CardBack />
                  </div>

                  {/* Front face — pre-rotated 180° so it appears when parent hits 180° */}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      borderRadius: 12, overflow: "hidden",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      backgroundImage: `url(${card.img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </motion.div>
              </div>

              {/* ── Hover highlight ──────────────────────────────────────── */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute", inset: 0,
                    borderRadius: 12,
                    border: "2px solid rgba(253,230,138,0.75)",
                    boxShadow: "0 0 20px rgba(253,230,138,0.35), inset 0 0 14px rgba(253,230,138,0.08)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* ── Revealed glow ────────────────────────────────────────── */}
              {isRevealed && (
                <motion.div
                  style={{
                    position: "absolute", inset: 0,
                    borderRadius: 12,
                    border: "2px solid rgba(236,72,153,0.8)",
                    boxShadow: "0 0 32px rgba(236,72,153,0.55), 0 0 70px rgba(168,85,247,0.25)",
                    pointerEvents: "none",
                  }}
                  animate={{ opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 14 }}>
        <Btn
          onClick={drawRandom}
          disabled={phase !== "idle"}
          gradient="linear-gradient(135deg, #7c3aed, #ec4899)"
          shadow="rgba(124,58,237,0.4)"
        >
          Wylosuj kartę
        </Btn>
        <Btn
          onClick={doShuffle}
          disabled={phase !== "idle"}
          gradient="linear-gradient(135deg, #3730a3, #6d28d9)"
          shadow="rgba(55,48,163,0.4)"
        >
          Potasuj talię
        </Btn>
      </div>

      {/* Ambient background pulse */}
      <motion.div
        style={{
          position: "fixed", top: "50%", left: "50%",
          translate: "-50% -50%",
          width: 800, height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(88,28,135,0.09), transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── Reusable button ──────────────────────────────────────────────────────────

function Btn({
  children,
  onClick,
  disabled,
  gradient,
  shadow,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  gradient: string;
  shadow: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "11px 26px",
        background: gradient,
        borderRadius: 999,
        border: "none",
        color: "white",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.06em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.28 : 1,
        boxShadow: `0 4px 18px ${shadow}`,
        transition: "transform 0.12s, opacity 0.2s",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(1.07)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseDown={(e)  => { if (!disabled) e.currentTarget.style.transform = "scale(0.95)"; }}
      onMouseUp={(e)    => { if (!disabled) e.currentTarget.style.transform = "scale(1.07)"; }}
    >
      {children}
    </button>
  );
}
