// const mongoose = require("mongoose");

// const QuestionSchema = new mongoose.Schema({
//   question: { type: String, required: true },
//   options: { type: [String], required: true },
//   answer: { type: String, required: true },
//   hint: {type: String, required: true},
//   difficulty: { type: String, required: true},
//   explanation: { type: String, required: true},
//   solved: { type: Boolean, default: false },
//   chosenAnswer: { type: String, default: "" },
//   isCorrect: { type: Boolean, default: true},
// });

// const DailyQuizSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     subject: { type: String, required: true },
//     level: { type: String, required: true },
//     questions: [
//       {
//         DailyQuestions : [QuestionSchema],
//         date: { type: String, required: true },
//         totalQuestions: { type: Number, default: 0 },
//         completedAt: { type: Date },
//         score: { type: Number, default: 0 },
//       }
//     ],
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("DailyQuiz", DailyQuizSchema);






const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: String, required: true },
  hint: { type: String, required: true },
  difficulty: { type: String, required: true },
  explanation: { type: String, required: true },
  solved: { type: Boolean, default: false },
  chosenAnswer: { type: String, default: "" },
  isCorrect: { type: Boolean, default: false },
  answeredAt: { type: Date }
});

const DailyQuizSessionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  questions: [QuestionSchema],
  completedAt: { type: Date },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 }
});

const DailyQuizSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true // One document per user
    },
    currentSession: {
      date: { type: String },
      sessionId: { type: mongoose.Schema.Types.ObjectId }
    },
    sessions: [DailyQuizSessionSchema],
    stats: {
      totalQuizzes: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 },
      totalQuestionsAnswered: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

// Index for efficient querying
DailyQuizSchema.index({ userId: 1, "sessions.date": 1 });

module.exports = mongoose.model("DailyQuiz", DailyQuizSchema);