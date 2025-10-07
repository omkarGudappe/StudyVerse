import React, { useState } from "react";
import { motion } from "framer-motion";

const FlashcardView = ({ card }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      className="w-full h-64 perspective"
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer"
        animate={{ rotateY: flipped ? 180 : 0 }}
      >
        <div className="absolute inset-0 bg-neutral-800 text-white rounded-2xl border border-neutral-700/50 p-5 flex flex-col justify-center backface-hidden">
          {!flipped && (
            <>
                <h4 className="text-lg font-semibold mb-3">{card.question}</h4>
                <ul className="space-y-2">
                    {card.options.map((opt, i) => (
                    <li
                        key={i}
                        className="bg-neutral-700/50 px-3 py-2 rounded-xl hover:bg-purple-600/30 transition"
                    >
                        {opt || <span className="text-neutral-500">Option {i + 1}</span>}
                    </li>
                    ))}
                </ul>
            </>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 to-emerald-400/20 text-white rounded-2xl border border-green-500/40 p-5 flex items-center justify-center text-xl font-bold rotate-y-180 backface-hidden">
          {card.answer}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlashcardView;
