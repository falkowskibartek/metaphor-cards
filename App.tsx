import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Card = { id: number; img: string };
type Pos  = { rotate: number; y: number };
type Phase = "idle" | "gather" | "spread";
type Message = { role: "bot" | "user"; text: string };

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

const N = ALL_CARDS.length; // 18

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return w;
}

// ─── Derived layout from available width ──────────────────────────────────────
//
// Keep CARD_W / OVERLAP = 112 / 36 ≈ 3.11 (the "desktop ratio").
// Solve: (N-1) * overlap + cardW = availW
//        => overlap = availW / (N - 1 + ratio)
// If that gives cardW < MIN_CARD_W, lock cardW and solve for overlap instead.
//
const DESIGN_RATIO  = 112 / 36; // cardW ÷ overlap at full desktop size
const MAX_CARD_W    = 112;
const MAX_OVERLAP   = 36;
const MIN_CARD_W    = 58;

function calcLayout(windowWidth: number) {
  const isMobile = windowWidth < 640;
  const hPad     = isMobile ? 16 : 48;
  const availW   = Math.min(windowWidth - hPad * 2, (N - 1) * MAX_OVERLAP + MAX_CARD_W);

  let overlap = Math.min(MAX_OVERLAP, Math.floor(availW / (N - 1 + DESIGN_RATIO)));
  let cardW   = Math.min(MAX_CARD_W, Math.round(overlap * DESIGN_RATIO));

  if (cardW < MIN_CARD_W) {
    cardW   = MIN_CARD_W;
    overlap = Math.max(8, Math.floor((availW - cardW) / (N - 1)));
  }

  const cardH   = Math.round(cardW * (182 / 112));
  const spreadW = (N - 1) * overlap + cardW;

  return { isMobile, hPad, cardW, cardH, overlap, spreadW };
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const OPENING_MESSAGE =
  "Witaj. Wyciągnąłeś tę kartę nieprzypadkowo. Co widzisz, kiedy na nią patrzysz? Jakie pierwsze skojarzenie przychodzi ci do głowy?";

const MOCK_BOT_REPLIES = [
  "To bardzo głęboka refleksja. Zastanów się, co ta karta mówi ci o twoich obecnych wyzwaniach.",
  "Interesująca interpretacja. Karta często ujawnia to, co już podświadomie wiemy, ale boimy się przyznać.",
  "Twoje słowa niosą dużo mądrości. Co byś zrobił, gdybyś nie czuł strachu?",
  "To piękne spostrzeżenie. Jak ta energia, którą widzisz w karcie, może się przełożyć na twoje życie właśnie teraz?",
  "Czuję, że ta karta trafiła do ciebie we właściwym momencie. Zaufaj temu, co czujesz.",
  "Bardzo trafna obserwacja. Jakie zmiany chciałbyś wprowadzić w swoim życiu, inspirując się tym obrazem?",
];

function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: OPENING_MESSAGE },
  ]);
  const [input, setInput]     = useState("");
  const [replyIdx, setReplyIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setIsTyping(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "bot", text: MOCK_BOT_REPLIES[replyIdx % MOCK_BOT_REPLIES.length] },
      ]);
      setReplyIdx((i) => i + 1);
      setIsTyping(false);
    }, 900 + Math.random() * 700);
  };

  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        overflow: "hidden",
        flex: 1, minWidth: 0,
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1, overflowY: "auto",
          padding: "16px 16px 8px",
          display: "flex", flexDirection: "column", gap: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf:  msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth:   "82%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #7c3aed, #ec4899)"
                : "rgba(255,255,255,0.09)",
              borderRadius: msg.role === "user"
                ? "14px 14px 4px 14px"
                : "14px 14px 14px 4px",
              padding: "9px 13px",
              fontSize: 13, lineHeight: 1.55, color: "white",
            }}
          >
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div
            style={{
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.09)",
              borderRadius: "14px 14px 14px 4px",
              padding: "11px 14px",
              display: "flex", gap: 5, alignItems: "center",
            }}
          >
            {[0, 1, 2].map((dot) => (
              <motion.div
                key={dot}
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(255,255,255,0.45)",
                }}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: dot * 0.14, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          display: "flex", gap: 8, padding: "10px 12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Napisz swoją odpowiedź…"
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 999,
            padding: "8px 14px",
            color: "white", fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || isTyping}
          style={{
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            border: "none", borderRadius: "50%",
            width: 36, height: 36, flexShrink: 0,
            cursor: !input.trim() || isTyping ? "not-allowed" : "pointer",
            opacity: !input.trim() || isTyping ? 0.4 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "opacity 0.15s",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── CardBack ─────────────────────────────────────────────────────────────────

function CardBack({ cardW }: { cardW: number }) {
  const svgSize = Math.max(20, Math.round(cardW * 0.38));
  return (
    <div
      style={{
        width: "100%", height: "100%",
        background: "linear-gradient(150deg, #2d1b4e 0%, #120828 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "76%", height: "80%",
          border: "1.5px solid rgba(255,215,0,0.22)",
          borderRadius: Math.round(cardW * 0.07),
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width={svgSize} height={svgSize} viewBox="0 0 60 60" style={{ opacity: 0.28 }}>
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
  const windowWidth = useWindowWidth();
  const { isMobile, hPad, cardW, cardH, overlap, spreadW } = calcLayout(windowWidth);

  const [spread,    setSpread]    = useState<Card[]>(() => shuffleArr(ALL_CARDS));
  const [positions, setPositions] = useState<Pos[]>(() => genPositions());
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const [hoveredId,  setHoveredId]  = useState<number | null>(null);
  const [phase, setPhase]           = useState<Phase>("idle");

  // Per-card stable gather offsets, computed once on mount
  const gatherOffsets = useRef(
    new Map(ALL_CARDS.map((c) => [c.id, {
      dx: (Math.random() - 0.5) * 38,
      dy: (Math.random() - 0.5) * 22,
      dr: (Math.random() - 0.5) * 14,
    }]))
  );

  const centerX    = (spreadW - cardW) / 2;
  const revealLift = Math.round(cardH * 0.28);
  const hoverLift  = Math.round(cardH * 0.10);
  const borderR    = Math.max(8, Math.round(cardW * 0.11));

  const revealedCard = revealedId !== null ? spread.find(c => c.id === revealedId) ?? null : null;

  const handleCardClick = (card: Card) => {
    if (phase !== "idle") return;
    setRevealedId((prev) => (prev === card.id ? null : card.id));
  };

  const drawRandom = () => {
    if (phase !== "idle") return;
    const eligible = spread.filter((c) => c.id !== revealedId);
    if (!eligible.length) return;
    setRevealedId(eligible[Math.floor(Math.random() * eligible.length)].id);
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
        gap: isMobile ? 28 : 52,
        background: "radial-gradient(ellipse at 50% 45%, #1c0d35, #040008 80%)",
        padding: `24px ${hPad}px`,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        // Prevent content from overflowing horizontally
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── Title ─────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: isMobile ? 28 : 44,
            fontFamily: "Georgia, serif",
            color: "#fde68a",
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          Magiczne Karty
        </h1>
        <p
          style={{
            opacity: 0.3,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontSize: isMobile ? 9 : 10,
            margin: "6px 0 0",
          }}
        >
          Zaufaj intuicji
        </p>
      </div>

      {/* ── Card spread ───────────────────────────────────────────────────── */}
      {/*
          The container is exactly spreadW wide.
          overflow:visible lets the lifted/scaled revealed card extend upward
          without being clipped. The parent div clips horizontal overflow via
          overflowX:hidden on the root, so nothing ever bleeds off-screen.
      */}
      <div
        style={{
          position: "relative",
          width: spreadW,
          height: cardH + revealLift + 20,
          overflow: "visible",
          flexShrink: 0,
        }}
      >
        {spread.map((card, index) => {
          const pos        = positions[index];
          const isRevealed = card.id === revealedId;
          // Never show hover state on touch devices — fingers don't hover
          const isHovered  = !isMobile && card.id === hoveredId && !isRevealed && phase === "idle";
          const go         = gatherOffsets.current.get(card.id)!;

          // Cards furthest from center get a slightly later gather delay so
          // they arrive at the same time → natural sweeping motion
          const distFrac    = Math.abs(index - (N - 1) / 2) / ((N - 1) / 2);
          const gatherDelay = (1 - distFrac) * 0.12;
          const spreadDelay = index * 0.035;

          return (
            <motion.div
              key={card.id}
              style={{
                position: "absolute",
                left: 0,
                top: revealLift,   // baseline; upward lift still stays inside container
                width: cardW,
                height: cardH,
                zIndex:  isRevealed ? 1000 : isHovered ? 500 : index,
                cursor:  phase === "idle" ? "pointer" : "default",
                touchAction: "manipulation", // prevent iOS double-tap zoom
              }}
              onClick={() => handleCardClick(card)}
              onMouseEnter={() => { if (!isMobile && phase === "idle") setHoveredId(card.id); }}
              onMouseLeave={() => setHoveredId(null)}
              animate={
                phase === "gather"
                  ? { x: centerX + go.dx, y: go.dy, rotate: go.dr, scale: 1 }
                  : {
                      x:      index * overlap,
                      y:      isRevealed ? pos.y - revealLift : isHovered ? pos.y - hoverLift : pos.y,
                      scale:  isRevealed ? 1.22 : isHovered ? 1.06 : 1,
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
              {/* ── CSS 3-D flip ──────────────────────────────────────────── */}
              <div style={{ width: "100%", height: "100%", perspective: cardW * 9 }}>
                <motion.div
                  style={{
                    width: "100%", height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    borderRadius: borderR,
                  }}
                  animate={{ rotateY: isRevealed ? 180 : 0 }}
                  transition={{ duration: 0.74, ease: [0.4, 0, 0.15, 1] }}
                >
                  {/* Back face */}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      borderRadius: borderR, overflow: "hidden",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.7)",
                    }}
                  >
                    <CardBack cardW={cardW} />
                  </div>

                  {/* Front face — pre-rotated 180° */}
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      borderRadius: borderR, overflow: "hidden",
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

              {/* ── Hover highlight (desktop only) ────────────────────────── */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute", inset: 0,
                    borderRadius: borderR,
                    border: "2px solid rgba(253,230,138,0.75)",
                    boxShadow: "0 0 20px rgba(253,230,138,0.35), inset 0 0 14px rgba(253,230,138,0.08)",
                    pointerEvents: "none",
                  }}
                />
              )}

              {/* ── Revealed glow ─────────────────────────────────────────── */}
              {isRevealed && (
                <motion.div
                  style={{
                    position: "absolute", inset: 0,
                    borderRadius: borderR,
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

      {/* ── Card + Chat overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {revealedCard && (
          <motion.div
            key="overlay"
            style={{
              position: "fixed", inset: 0,
              zIndex: 2000,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(4,0,8,0.88)",
              padding: isMobile ? 16 : 32,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setRevealedId(null)}
          >
            <motion.div
              style={{
                position: "relative",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "center" : "stretch",
                gap: isMobile ? 16 : 24,
                width: "100%",
                maxWidth: isMobile ? 360 : 760,
                height: isMobile ? undefined : 400,
                maxHeight: "90vh",
              }}
              initial={{ scale: 0.5, y: 80 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 80 }}
              transition={{ type: "spring", stiffness: 290, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setRevealedId(null)}
                style={{
                  position: "absolute", top: -14, right: -14, zIndex: 10,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  color: "white", fontSize: 18, lineHeight: 1,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ×
              </button>

              {/* Card */}
              {(() => {
                const ow = isMobile
                  ? Math.min(Math.round(windowWidth * 0.44), 160)
                  : Math.round(400 * 112 / 182);
                const oh = Math.round(ow * (182 / 112));
                const or = Math.max(10, Math.round(ow * 0.11));
                return (
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: ow, height: oh,
                        borderRadius: or, overflow: "hidden",
                        backgroundImage: `url(${revealedCard.img})`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        boxShadow: "0 0 70px rgba(236,72,153,0.5), 0 24px 70px rgba(0,0,0,0.9)",
                      }}
                    />
                    <motion.div
                      style={{
                        position: "absolute", inset: 0, borderRadius: or,
                        border: "2px solid rgba(236,72,153,0.85)",
                        boxShadow: "0 0 40px rgba(236,72,153,0.5), 0 0 90px rgba(168,85,247,0.22)",
                        pointerEvents: "none",
                      }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                );
              })()}

              {/* Chat */}
              <div style={{
                flex: 1, minWidth: 0,
                height: isMobile ? 300 : "100%",
                width: isMobile ? "100%" : undefined,
                display: "flex",
              }}>
                <ChatPanel key={revealedCard.id} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Buttons ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: isMobile ? 10 : 14, flexWrap: "wrap", justifyContent: "center" }}>
        <Btn
          onClick={drawRandom}
          disabled={phase !== "idle"}
          small={isMobile}
          gradient="linear-gradient(135deg, #7c3aed, #ec4899)"
          shadow="rgba(124,58,237,0.4)"
        >
          Wylosuj kartę
        </Btn>
        <Btn
          onClick={doShuffle}
          disabled={phase !== "idle"}
          small={isMobile}
          gradient="linear-gradient(135deg, #3730a3, #6d28d9)"
          shadow="rgba(55,48,163,0.4)"
        >
          Potasuj talię
        </Btn>
      </div>

      {/* ── Ambient pulse ─────────────────────────────────────────────────── */}
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

// ─── Button ───────────────────────────────────────────────────────────────────

function Btn({
  children, onClick, disabled, gradient, shadow, small,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  gradient: string;
  shadow: string;
  small: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding:       small ? "9px 18px" : "11px 26px",
        background:    gradient,
        borderRadius:  999,
        border:        "none",
        color:         "white",
        fontSize:      small ? 12 : 13,
        fontWeight:    500,
        letterSpacing: "0.06em",
        cursor:        disabled ? "not-allowed" : "pointer",
        opacity:       disabled ? 0.28 : 1,
        boxShadow:     `0 4px 18px ${shadow}`,
        transition:    "transform 0.12s, opacity 0.2s",
        touchAction:   "manipulation",
        WebkitTapHighlightColor: "transparent",
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
