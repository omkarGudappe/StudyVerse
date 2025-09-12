const express = require('express');
const { GenerateQuiz } = require('../GeminiSetUp/Gemini');
const Router = express.Router();
const Quiz = require('../Db/DailyQuiz');
const dayjs = require('dayjs');

Router.post('/generate-quiz' , async (req, res) => {
    const { subject , level, uid } = req.body;

    try{
        const today = dayjs().format('YYYY-MM-DD');
        
        let existingQuiz = await Quiz.findOne({userId: uid, date: today})

        if(existingQuiz){
            return res.json({ok: true, quiz: existingQuiz.questions })
        }

        const quiz = await GenerateQuiz(subject, level);
        if(!quiz){
           return res.status(404).json({message: "Somthing went Wrong"});
        }

       const quizStore = quiz.map((q) => {
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
                answer: answerText,
                difficulty: q.difficulty,
                explanation: q.explanation,
                solved: false,
                chosenAnswer: "",
            };
        });

        const newQuiz = new Quiz({
            userId: uid,
            subject,
            level,
            questions: quizStore,
            date: today,
        })

        await newQuiz.save();

        return res.json({ok: true, quiz: newQuiz.questions})

    }catch(err) {
        console.log(err.message);
        res.status(500).json({message: err.message});
    }
})

Router.post('/answer-quiz', async (req, res) => {
    const { chosenAnswer, uid, questionId } = req.body;

    const today = dayjs().format("YYYY-MM-DD");
    try{
        const quiz = Quiz.findOneAndUpdate(
            { userId: uid, date: today, "questions._id": questionId },
            {
                $set: {
                    "questions.$.solved" : true,
                    "questions.$.chosenAnswer" : chosenAnswer,
                }
            },
            { new: true },
        );
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        res.json({ ok: true, quiz });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = Router