import React, { useState } from "react";
import { motion } from "framer-motion";

const FlashcardView = ({ card }) => {
  const [flipped, setFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'hard': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <motion.div
      className="w-full h-64 perspective cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d flashcard-glow"
        animate={{ rotateY: flipped ? 180 : 0 }}
        whileHover={{ y: -5 }}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900 text-white rounded-2xl border border-neutral-700/50 p-6 flex flex-col backface-hidden overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {card.title || "Untitled Set"}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {card.difficulty && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(card.difficulty)} border`}>
                    {card.difficulty}
                  </span>
                )}
                {card.category && (
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {card.category}
                  </span>
                )}
              </div>
            </div>
            <motion.div
              animate={{ rotate: isHovered ? 180 : 0 }}
              className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0"
            >
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </motion.div>
          </div>

          {/* Question Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h5 className="text-base font-medium text-neutral-200 mb-3 line-clamp-2">
              {card.question || "No question provided"}
            </h5>
            <div className="space-y-2">
              {card.options && card.options.map((opt, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 5 }}
                  className={`p-2 rounded-lg text-sm transition-all duration-300 ${
                    opt 
                      ? 'bg-neutral-700/50 text-neutral-200 hover:bg-purple-600/30 hover:text-purple-200' 
                      : 'bg-neutral-800/30 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-neutral-600/50 flex items-center justify-center text-xs font-medium text-neutral-400">
                      {i + 1}
                    </div>
                    <span>{opt || `Option ${i + 1}`}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-neutral-700/50">
            <div className="flex justify-between items-center text-xs text-neutral-400">
              <span>Click to reveal answer</span>
              <motion.div
                animate={{ x: isHovered ? 3 : 0 }}
                className="flex items-center gap-1"
              >
                <span>Flip</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-emerald-500/10 text-white rounded-2xl border border-emerald-500/40 p-6 flex flex-col items-center justify-center text-center rotate-y-180 backface-hidden">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-emerald-400 mb-2">Correct Answer</h3>
          <p className="text-lg text-white mb-4 font-medium">
            {card.answer || "No answer provided"}
          </p>
          
          <div className="text-sm text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
            {card.category || "General Knowledge"}
          </div>

          <motion.div 
            className="mt-6 text-xs text-neutral-300 flex items-center gap-1"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>Click to flip back</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FlashcardView;