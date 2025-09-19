const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, required: true},
  explanation: { type: String, required: true},
  solved: { type: Boolean, default: false },
  chosenAnswer: { type: String, default: "" } 
});

const DailyQuizSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    level: { type: String, required: true },
    questions: [QuestionSchema],
    date: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DailyQuiz", DailyQuizSchema);
