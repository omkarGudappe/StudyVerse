const express = require('express');
const Router = express.Router();
const Quizes = require('../Db/DailyQuiz');

// Get user's quiz history for review
Router.get('/:id', async (req, res) => {
    const { id } = req.params;
    console.log("Fetching quiz history for user:", id);
    
    if(!id) {
        console.log("User ID is missing");
        return res.status(400).json({message: "User ID is missing"});
    }
    
    try {
        const userQuiz = await Quizes.findOne({ userId: id })
            .select('sessions stats currentSession');
        
        if(!userQuiz) {
            console.log("User quiz data not found");
            return res.json({
                ok: true, 
                message: "No quiz data found",
                quizHistory: [],
                stats: null 
            });
        }
        
        const completedSessions = userQuiz.sessions.filter(session => 
            session.completedAt && session.score !== undefined
        );
        
        const quizHistory = completedSessions.map(session => ({
            sessionId: session._id,
            date: session.date,
            score: session.score,
            totalQuestions: session.totalQuestions,
            completedAt: session.completedAt,
            questions: session.questions.map(q => ({
                _id: q._id,
                question: q.question,
                options: q.options,
                answer: q.answer,
                hint: q.hint,
                difficulty: q.difficulty,
                explanation: q.explanation,
                solved: q.solved,
                chosenAnswer: q.chosenAnswer,
                isCorrect: q.isCorrect,
                answeredAt: q.answeredAt
            }))
        }));
        
        console.log(`Found ${quizHistory.length} completed quizzes for review`);
        
        res.json({ 
            ok: true, 
            quizHistory: quizHistory,
            stats: userQuiz.stats,
            totalCompleted: quizHistory.length
        });
        
    } catch(err) {
        console.log("Error fetching quiz history:", err.message);
        res.status(500).json({message: "Server error while fetching quiz history"});
    }
});

// Get specific quiz session for review
Router.get('/session/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const { userId } = req.query;
    
    if(!sessionId || !userId) {
        return res.status(400).json({message: "Session ID and User ID are required"});
    }
    
    try {
        const userQuiz = await Quizes.findOne({ 
            userId: userId,
            'sessions._id': sessionId 
        });
        
        if(!userQuiz) {
            return res.status(404).json({message: "Quiz session not found"});
        }
        
        const session = userQuiz.sessions.id(sessionId);
        
        if(!session || !session.completedAt) {
            return res.status(404).json({message: "Completed quiz session not found"});
        }
        
        // Return read-only session data
        res.json({
            ok: true,
            session: {
                sessionId: session._id,
                date: session.date,
                score: session.score,
                totalQuestions: session.totalQuestions,
                completedAt: session.completedAt,
                questions: session.questions.map(q => ({
                    _id: q._id,
                    question: q.question,
                    options: q.options,
                    answer: q.answer,
                    hint: q.hint,
                    difficulty: q.difficulty,
                    explanation: q.explanation,
                    solved: q.solved,
                    chosenAnswer: q.chosenAnswer,
                    isCorrect: q.isCorrect,
                    answeredAt: q.answeredAt
                }))
            }
        });
        
    } catch(err) {
        console.log("Error fetching quiz session:", err.message);
        res.status(500).json({message: "Server error while fetching quiz session"});
    }
});

module.exports = Router;