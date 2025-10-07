import React, { useState } from "react";
import { motion } from "framer-motion";

const FlashcardCreator = ({ onAdd }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");

  const handleChangeOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return alert("Fill all fields!");

    onAdd({ question, options, answer });
    setQuestion("");
    setOptions(["", "", "", ""]);
    setAnswer("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-800/60 p-5 rounded-2xl border border-neutral-700/30 mb-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">
        Create a Flashcard
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
          className="w-full p-3 rounded-xl bg-neutral-700/40 border border-neutral-600/40 text-white outline-none focus:border-purple-500 transition"
        />

        <div className="grid grid-cols-2 gap-3">
          {options.map((opt, i) => (
            <input
              key={i}
              value={opt}
              onChange={(e) => handleChangeOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="p-3 rounded-xl bg-neutral-700/40 border border-neutral-600/40 text-white outline-none focus:border-amber-500 transition"
            />
          ))}
        </div>

        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Correct answer"
          className="w-full p-3 rounded-xl bg-neutral-700/40 border border-neutral-600/40 text-white outline-none focus:border-green-500 transition"
        />

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-amber-500 py-3 rounded-xl font-semibold hover:from-purple-500 hover:to-amber-400 transition"
        >
          Add Flashcard
        </button>
      </form>
    </motion.div>
  );
};

export default FlashcardCreator;
