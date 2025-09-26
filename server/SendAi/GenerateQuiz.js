// const express = require('express');
// const { GenerateQuiz } = require('../GeminiSetUp/Gemini');
// const Router = express.Router();
// const Quiz = require('../Db/DailyQuiz');
// const dayjs = require('dayjs');

// Router.post('/generate-quiz', async (req, res) => {
//     const { subject, level, uid } = req.body;

//     try {
//         const today = dayjs().format('YYYY-MM-DD');

//         if(!subject || !level || !uid) {
//             return res.json({message : "Missing Field"});
//         }
        
//         let existingQuiz = await Quiz.findOne({ userId: uid, date: today })

//         if (existingQuiz) {
//             return res.json({ ok: true, quiz: existingQuiz.questions })
//         }

//         const quiz = await GenerateQuiz(subject, level);
//         if (!quiz) {
//             return res.status(404).json({ message: "Something went Wrong" });
//         }

//         let questions = quiz;

//         if (!Array.isArray(questions) && questions.questions) {
//             questions = questions.questions;
//         }

//         if (!Array.isArray(questions)) {
//             throw new Error("Invalid quiz format from AI");
//         }

//         const quizStore = questions.map((q) => {
//             let optionsArray = [];
//             if (Array.isArray(q.options)) {
//                 optionsArray = q.options;
//             } else if (typeof q.options === "object") {
//                 optionsArray = Object.values(q.options);
//             }

//             let answerText = q.answer;
//             if (typeof q.options === "object" && q.answer in q.options) {
//                 answerText = q.options[q.answer];
//             }

//             return {
//                 question: q.question,
//                 options: optionsArray,
//                 hint: q.hint,
//                 answer: answerText,
//                 difficulty: q.difficulty,
//                 explanation: q.explanation,
//                 solved: false,
//                 chosenAnswer: "",
//                 isCorrect: false,
//                 answeredAt: null // Add timestamp for when answer was submitted
//             };
//         });

//         const newQuiz = new Quiz({
//             userId: uid,
//             subject,
//             level,
//             questions: quizStore,
//             date: today,
//         })

//         await newQuiz.save();

//         return res.json({ ok: true, quiz: newQuiz.questions })

//     } catch (err) {
//         console.log(err.message);
//         res.status(500).json({ message: err.message });
//     }
// })

// // Update individual answer endpoint - PREVENT MODIFICATION
// Router.post('/answer-quiz', async (req, res) => {
//     const { chosenAnswer, uid, questionId } = req.body;
//     const today = dayjs().format("YYYY-MM-DD");
    
//     try {
//         const quiz = await Quiz.findOne({ userId: uid, date: today });
        
//         if (!quiz) {
//             return res.status(404).json({ message: "Quiz not found" });
//         }
        
//         const question = quiz.questions.id(questionId);
//         if (!question) {
//             return res.status(404).json({ message: "Question not found" });
//         }
        
//         // Check if question is already answered - PREVENT MODIFICATION
//         if (question.solved) {
//             return res.status(400).json({ 
//                 message: "Question already answered and cannot be modified" 
//             });
//         }
        
//         // Update the question
//         question.solved = true;
//         question.chosenAnswer = chosenAnswer;
//         question.isCorrect = (chosenAnswer === question.answer);
//         question.answeredAt = new Date(); // Set timestamp
        
//         await quiz.save();
        
//         res.json({ ok: true, quiz });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ message: err.message });
//     }
// });

// // Bulk answer submission endpoint - PREVENT MODIFICATION
// Router.post('/submit-answers', async (req, res) => {
//     const { userId, answers, totalScore, quizLength } = req.body;
//     const today = dayjs().format('YYYY-MM-DD');
    
//     try {
//         // Find today's quiz for this user
//         const quiz = await Quiz.findOne({ userId: userId, date: today });
        
//         if (!quiz) {
//             return res.status(404).json({ message: "Quiz not found" });
//         }
        
//         // Check if quiz is already completed - PREVENT MODIFICATION
//         if (quiz.completedAt) {
//             return res.status(400).json({ 
//                 message: "Quiz already completed and answers cannot be modified" 
//             });
//         }
        
//         // Update each question with the submitted answer
//         let hasModifiedExistingAnswer = false;
        
//         for (const answerData of answers) {
//             const question = quiz.questions.id(answerData.questionId);
            
//             if (question) {
//                 // Check if question is already answered - PREVENT MODIFICATION
//                 if (question.solved && question.chosenAnswer !== answerData.chosenAnswer) {
//                     hasModifiedExistingAnswer = true;
//                     continue; // Skip this question to prevent modification
//                 }
                
//                 // Only update if not already answered
//                 if (!question.solved) {
//                     question.solved = true;
//                     question.chosenAnswer = answerData.chosenAnswer;
//                     question.isCorrect = answerData.isCorrect;
//                     question.answeredAt = new Date();
//                 }
//             }
//         }
        
//         // Add score information to the quiz document
//         quiz.score = totalScore;
//         quiz.totalQuestions = quizLength;
//         quiz.completedAt = new Date();
        
//         await quiz.save();
        
//         if (hasModifiedExistingAnswer) {
//             return res.json({ 
//                 ok: true, 
//                 message: "Answers submitted successfully (some answers were not modified as they were already submitted)" 
//             });
//         }
        
//         res.json({ ok: true, message: "Answers submitted successfully" });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ message: err.message });
//     }
// });

// // Add endpoint to check if quiz is already completed
// Router.get('/quiz-status/:userId', async (req, res) => {
//     const { userId } = req.params;
//     const today = dayjs().format('YYYY-MM-DD');
    
//     try {
//         const quiz = await Quiz.findOne({ userId: userId, date: today });
        
//         if (!quiz) {
//             return res.json({ exists: false, completed: false });
//         }
        
//         res.json({ 
//             exists: true, 
//             completed: !!quiz.completedAt,
//             score: quiz.score,
//             totalQuestions: quiz.totalQuestions
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).json({ message: err.message });
//     }
// });

// module.exports = Router;










const express = require('express');
const { GenerateQuiz } = require('../GeminiSetUp/Gemini');
const Router = express.Router();
const Quiz = require('../Db/DailyQuiz');
const dayjs = require('dayjs');

// Generate or get today's quiz
Router.post('/generate-quiz', async (req, res) => {
    const { subject, level, uid } = req.body;

    try {
        const today = dayjs().format('YYYY-MM-DD');

        if(!subject || !level || !uid) {
            return res.status(400).json({message: "Missing required fields"});
        }
        
        // Find user's quiz document (create if doesn't exist)
        let userQuiz = await Quiz.findOne({ userId: uid });
        
        if (!userQuiz) {
            userQuiz = new Quiz({ 
                userId: uid,
                sessions: [],
                stats: {
                    totalQuizzes: 0,
                    averageScore: 0,
                    bestScore: 0,
                    totalQuestionsAnswered: 0,
                    correctAnswers: 0
                }
            });
        }

        // Check if today's session already exists
        const existingSession = userQuiz.sessions.find(session => 
            session.date === today
        );

        if (existingSession) {
            userQuiz.currentSession = {
                date: today,
                sessionId: existingSession._id
            };
            await userQuiz.save();
            
            return res.json({ 
                ok: true, 
                quiz: existingSession.questions,
                sessionId: existingSession._id 
            });
        }

        // Generate new quiz questions
        const quizData = await GenerateQuiz(subject, level);
        if (!quizData) {
            return res.status(500).json({ message: "Failed to generate quiz" });
        }

        let questions = quizData;
        if (!Array.isArray(questions) && questions.questions) {
            questions = questions.questions;
        }

        if (!Array.isArray(questions)) {
            throw new Error("Invalid quiz format from AI");
        }

        // Process questions
        const quizQuestions = questions.map((q) => {
            let optionsArray = [];
            if (Array.isArray(q.options)) {
                optionsArray = q.options;
            } else if (typeof q.options === "object") {
                optionsArray = Object.values(q.options);
            }

            let answerText = q.answer;
            if (typeof q.options === "object" && q.answer in q.options) {
                answerText = q.options[q.answer];
            }

            return {
                question: q.question,
                options: optionsArray,
                hint: q.hint || "",
                answer: answerText,
                difficulty: q.difficulty || "medium",
                explanation: q.explanation || "",
                solved: false,
                chosenAnswer: "",
                isCorrect: false,
            };
        });

        // Create new session
        const newSession = {
            date: today,
            questions: quizQuestions,
            totalQuestions: quizQuestions.length,
            score: 0,
            completedAt: null
        };

        userQuiz.sessions.push(newSession);
        const newSessionDoc = userQuiz.sessions[userQuiz.sessions.length - 1];
        
        userQuiz.currentSession = {
            date: today,
            sessionId: newSessionDoc._id
        };

        userQuiz.stats.totalQuizzes += 1;

        await userQuiz.save();

        return res.json({ 
            ok: true, 
            quiz: newSessionDoc.questions,
            sessionId: newSessionDoc._id 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

Router.post('/answer-quiz', async (req, res) => {
    const { chosenAnswer, uid, questionId, sessionId } = req.body;
    
    try {
        const userQuiz = await Quiz.findOne({ userId: uid });
        if (!userQuiz) {
            console.log( "User quiz not found" )
            return res.status(404).json({ message: "User quiz not found" });
        }

        // Find the session
        const session = userQuiz.sessions.id(sessionId);
        if (!session) {
            console.log( "Session not found" )
            return res.status(404).json({ message: "Session not found" });
        }

        // Check if session is completed
        if (session.completedAt) {
            console.log("Quiz already completed - answers cannot be modified")
            return res.status(400).json({ 
                message: "Quiz already completed - answers cannot be modified" 
            });
        }

        const question = session.questions.id(questionId);
        if (!question) {
            console.log("Question not found")
            return res.status(404).json({ message: "Question not found" });
        }

        // Prevent modification of already answered questions
        if (question.solved) {
            console.log("Question already answered and cannot be modified" );
            return res.status(400).json({ 
                message: "Question already answered and cannot be modified" 
            });
        }

        // Update question
        question.solved = true;
        question.chosenAnswer = chosenAnswer;
        question.isCorrect = (chosenAnswer === question.answer);
        question.answeredAt = new Date();

        // Update stats
        userQuiz.stats.totalQuestionsAnswered += 1;
        if (question.isCorrect) {
            userQuiz.stats.correctAnswers += 1;
        }

        await userQuiz.save();
        res.json({ ok: true, question });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Complete the quiz session
Router.post('/complete-quiz', async (req, res) => {
    const { uid, sessionId, score } = req.body;
    
    try {
        const userQuiz = await Quiz.findOne({ userId: uid });
        if (!userQuiz) {
            return res.status(404).json({ message: "User quiz not found" });
        }

        const session = userQuiz.sessions.id(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        if (session.completedAt) {
            return res.status(400).json({ message: "Quiz already completed" });
        }

        session.completedAt = new Date();
        session.score = score;

        // Update stats
        if (score > userQuiz.stats.bestScore) {
            userQuiz.stats.bestScore = score;
        }

        // Calculate average score
        const completedSessions = userQuiz.sessions.filter(s => s.completedAt);
        const totalScore = completedSessions.reduce((sum, s) => sum + s.score, 0);
        userQuiz.stats.averageScore = totalScore / completedSessions.length;

        await userQuiz.save();
        res.json({ ok: true, session });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

// Get user's quiz status and history
Router.get('/quiz-status/:userId', async (req, res) => {
    const { userId } = req.params;
    const today = dayjs().format('YYYY-MM-DD');
    
    try {
        const userQuiz = await Quiz.findOne({ userId: userId })
            .select('sessions stats currentSession');
        
        if (!userQuiz) {
            return res.json({ 
                exists: false, 
                hasTodayQuiz: false,
                stats: null,
                history: []
            });
        }

        const todaySession = userQuiz.sessions.find(s => s.date === today);
        const completedSessions = userQuiz.sessions.filter(s => s.completedAt);

        res.json({ 
            exists: true,
            hasTodayQuiz: !!todaySession,
            todayCompleted: todaySession ? !!todaySession.completedAt : false,
            stats: userQuiz.stats,
            history: completedSessions.map(s => ({
                date: s.date,
                score: s.score,
                totalQuestions: s.totalQuestions
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = Router;