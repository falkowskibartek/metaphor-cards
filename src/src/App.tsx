import { useState } from "react";
import { motion } from "framer-motion";

const cards = [
  { id: 1, title: "Sowa", subtitle: "Mądrość i intuicja", img: "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=400" },
  { id: 2, title: "Lis", subtitle: "Spryt i adaptacja", img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400" },
  { id: 3, title: "Latarnia", subtitle: "Prowadzenie i jasność", img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400" },
  { id: 4, title: "Smok", subtitle: "Siła i transformacja", img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400" },
  { id: 5, title: "Amulet", subtitle: "Ochrona i energia", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400" }
];

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function MagicCardsApp() {
  const [deck, setDeck] = useState(cards);
  const [selected, setSelected] = useState(null);

  const drawCard = () => {
    if (!deck.length) return;
    const randomIndex = Math.floor(Math.random() * deck.length);
    const card = deck[randomIndex];
    setSelected(card);
  };

  const shuffleDeck = () => {
    setDeck(shuffle(cards));
    setSelected(null);
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "radial-gradient(circle at center, #1a0b2e, #000)" }}
    >
      {/* Title */}
      <h1 className="text-5xl font-serif mb-2 text-yellow-300">Magiczne Karty</h1>
      <p className="mb-8 opacity-70">Zaufaj intuicji...</p>

      {/* Cards row */}
      <div className="flex gap-6 mb-10 items-end">
        {cards.map((card) => {
          const isSelected = selected?.id === card.id;

          return (
            <motion.div
              key={card.id}
              onClick={() => setSelected(card)}
              initial={false}
              animate={{
                scale: isSelected ? 1.35 : selected ? 0.85 : 1,
                y: isSelected ? -40 : 0,
                opacity: selected && !isSelected ? 0.4 : 1,
                zIndex: isSelected ? 10 : 1
              }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              whileHover={{ scale: isSelected ? 1.4 : 1.1 }}
              className={`w-44 h-72 rounded-2xl overflow-hidden shadow-2xl border cursor-pointer relative ${
                isSelected
                  ? "border-pink-400 shadow-pink-500/50"
                  : "border-yellow-500"
              }`}
              style={{
                boxShadow: isSelected
                  ? "0 0 40px rgba(236,72,153,0.9), 0 0 80px rgba(168,85,247,0.7)"
                  : ""
              }}
            >
              {/* pulsujący glow */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    background:
                      "radial-gradient(circle, rgba(236,72,153,0.4), transparent 70%)"
                  }}
                />
              )}

              <div
                className="h-full flex flex-col justify-end p-3 relative"
                style={{
                  backgroundImage: `url(${card.img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="bg-black/60 rounded p-2">
                  <h3 className="text-lg font-bold">{card.title}</h3>
                  <p className="text-sm opacity-80">{card.subtitle}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected card display */}
      {selected && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 text-center"
        >
          <h2 className="text-3xl mb-2 text-pink-300">{selected.title}</h2>
          <p className="opacity-70">{selected.subtitle}</p>
        </motion.div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={drawCard}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:scale-105 transition"
        >
          Wylosuj kartę
        </button>
        <button
          onClick={shuffleDeck}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-700 rounded-full shadow-lg hover:scale-105 transition"
        >
          Potasuj talię
        </button>
      </div>

      {/* Glow background */}
      <motion.div
        className="absolute w-[600px] h-[600px] bg-purple-600 opacity-20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    </div>
  );
}
