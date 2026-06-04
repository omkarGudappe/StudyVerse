import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FlashcardCreator = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    question: "",
    options: ["", "", "", ""],
    answer: "",
    difficulty: "medium",
    category: ""
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChangeOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim() || !formData.title.trim()) {
      alert("Please fill in all required fields!");
      return;
    }

    const token = localStorage.getItem('token');

    const res = await axios.post(`
      ${import.meta.env.VITE_API_URL}/flashcards/create`,
      formData,
      {
        headers: {
          'Authorization' : `Bearer ${token}`,
        }
      }
    )

    if(res.data.ok) {
      
    }
    const newCard = {
      ...formData,
      id: Date.now(),
      progress: 0,
      cards: 1,
      difficulty: formData.difficulty.charAt(0).toUpperCase() + formData.difficulty.slice(1)
    };

    

    onAdd(newCard);
    setFormData({
      title: "",
      question: "",
      options: ["", "", "", ""],
      answer: "",
      difficulty: "medium",
      category: ""
    });
    setIsExpanded(false);
  };


  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'border-emerald-500 text-emerald-400';
      case 'medium': return 'border-amber-500 text-amber-400';
      case 'hard': return 'border-rose-500 text-rose-400';
      default: return 'border-purple-500 text-purple-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-neutral-800/90 backdrop-blur-xl p-6 rounded-2xl border border-neutral-700/50 shadow-2xl w-full max-w-md mx-auto"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
          Create Flashcard
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-neutral-700/50 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Set Title *
          </label>
          <input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter flashcard set title"
            className="w-full p-3 rounded-xl bg-neutral-700/60 border border-neutral-600/50 text-white placeholder-neutral-400 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Question *
          </label>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            placeholder="Enter your question"
            rows="2"
            className="w-full p-3 rounded-xl bg-neutral-700/60 border border-neutral-600/50 text-white placeholder-neutral-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 resize-none"
            required
          />
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-neutral-700/40 rounded-xl border border-neutral-600/40 hover:border-neutral-500/50 transition-colors"
        >
          <span className="text-neutral-300 text-sm font-medium">
            Additional Options
          </span>
          <motion.svg
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="w-4 h-4 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Category Input */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Category
                </label>
                <input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Mathematics, Science"
                  className="w-full p-3 rounded-xl bg-neutral-700/60 border border-neutral-600/50 text-white placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                />
              </div>

              {/* Difficulty Selector */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['easy', 'medium', 'hard'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: level })}
                      className={`p-2 rounded-lg border-2 text-sm font-medium capitalize transition-all duration-300 ${
                        formData.difficulty === level
                          ? getDifficultyColor(level) + ' bg-opacity-20'
                          : 'border-neutral-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options Grid */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Multiple Choice Options
          </label>
          <div className="grid grid-cols-2 gap-3">
            {formData.options.map((opt, i) => (
              <div key={i} className="relative">
                <input
                  value={opt}
                  onChange={(e) => handleChangeOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="w-full p-3 rounded-xl bg-neutral-700/60 border border-neutral-600/50 text-white placeholder-neutral-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
                />
                <div className="absolute inset-y-0 left-3 flex items-center">
                  <div className="w-5 h-5 rounded border border-neutral-500 flex items-center justify-center text-xs text-neutral-400 font-medium">
                    {i + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Input */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Correct Answer *
          </label>
          <input
            value={formData.answer}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            placeholder="Enter the correct answer"
            className="w-full p-3 rounded-xl bg-neutral-700/60 border border-neutral-600/50 text-white placeholder-neutral-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700/70 hover:text-white transition-all duration-300 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold hover:from-purple-500 hover:to-amber-400 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
          >
            Create Flashcard
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default FlashcardCreator;