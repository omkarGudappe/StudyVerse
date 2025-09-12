import React, { useState, useEffect } from 'react'
import { UserDataContextExport } from '../CurrentUserContexProvider'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const DailyQuiz = () => {
  const { ProfileData } = UserDataContextExport();
  const [dailyQuizzes, setDailyQuizzes] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const Education = ProfileData?.education?.split(',') || [];

  useEffect(() => {
    if (!ProfileData) return;
    
    const GetQuizFromAI = async () => {
      const ID = ProfileData?._id;
      const level = `${Education?.[0]} ${Education?.[1]}` || 'General knowledge';
      
      setIsLoading(true);
      setError(null);
      
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/AI/generate-quiz`, {
          subject: 'include any subject according to student level',
          level: level,
          uid: ID
        });

        if (res.data.ok && res.data.quiz) {
          setDailyQuizzes(res.data.quiz);
          console.log(res.data.quiz);
        } else {
          setError(res.data.message || 'Failed to load quiz');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load quiz');
        console.error('Quiz loading error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    GetQuizFromAI();
  }, [ProfileData]);

  const handleOptionSelect = (option) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    
    const currentQuestion = dailyQuizzes[currentQuestionIndex];
    if (option === currentQuestion.answer) {
      setScore(prev => prev + 1);
    }
    
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < dailyQuizzes.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      setReviewMode(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setQuizCompleted(false);
    setReviewMode(false);
    setShowResult(false);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400 border-emerald-400/30';
      case 'medium': return 'text-amber-400 border-amber-400/30';
      case 'hard': return 'text-rose-400 border-rose-400/30';
      default: return 'text-gray-400 border-gray-400/30';
    }
  };

  const getDifficultyBgColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-400/10';
      case 'medium': return 'bg-amber-400/10';
      case 'hard': return 'bg-rose-400/10';
      default: return 'bg-gray-400/10';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading your daily quiz...</p>
          <p className="text-gray-500 text-sm mt-2">Preparing challenging questions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center max-w-md">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-gray-200 text-xl font-semibold mb-2">Error Loading Quiz</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-8 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-100 mb-4">Quiz Completed</h2>
          
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <p className="text-gray-400 text-sm mb-2">Your Score</p>
            <div className="text-3xl font-bold text-gray-100 mb-2">
              {score} / {dailyQuizzes.length}
            </div>
            <p className="text-gray-500 text-sm">
              {score === dailyQuizzes.length ? 'Perfect score! Excellent work.' :
               score >= dailyQuizzes.length * 0.7 ? 'Great job! Well done.' :
               score >= dailyQuizzes.length * 0.5 ? 'Good effort. Keep practicing.' :
               'Keep learning and try again.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Correct</p>
              <p className="text-emerald-400 text-lg font-semibold">{score}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Incorrect</p>
              <p className="text-rose-400 text-lg font-semibold">{dailyQuizzes.length - score}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setReviewMode(true);
                setQuizCompleted(false);
                setCurrentQuestionIndex(0);
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-3 rounded-lg transition-colors duration-200"
            >
              Review Answers
            </button>
            <button
              onClick={restartQuiz}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-3 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = dailyQuizzes[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion?.answer;
  const showExplanation = showResult || reviewMode;

  return (
    <div className="min-h-screen bg-neutral-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-100 mb-2">
            {reviewMode ? 'Review Mode' : 'Daily Quiz'}
          </h1>
          <p className="text-gray-500">
            {reviewMode ? 'Review your answers and learn' : 'Test your knowledge'}
          </p>
        </div>

        <div className="bg-neutral-800 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${((currentQuestionIndex + 1) / dailyQuizzes.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gray-600 rounded-full"
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <span className="text-gray-400 text-sm">
            {currentQuestionIndex + 1} / {dailyQuizzes.length}
          </span>

          <button
            onClick={handleNextQuestion}
            disabled={!reviewMode && !showResult}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-300"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <motion.div
          key={currentQuestionIndex}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-neutral-900 border border-gray-700 rounded-xl p-6 mb-6"
        >
\          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500 text-sm">
              Question {currentQuestionIndex + 1} of {dailyQuizzes.length}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(currentQuestion.difficulty)} ${getDifficultyBgColor(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-lg text-gray-100 font-medium mb-6 leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="space-y-2 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isOptionCorrect = option === currentQuestion.answer;
              const isOptionSelected = selectedOption === option;
              const showAsCorrect = showExplanation && isOptionCorrect;
              const showAsIncorrect = showExplanation && isOptionSelected && !isOptionCorrect;
              
              return (
                <motion.div
                  key={index}
                  className={`w-full p-4 rounded-lg border transition-all duration-200
                    ${isOptionSelected
                      ? isOptionCorrect
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : 'border-rose-500 bg-rose-500/5'
                      : showAsCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-gray-600 bg-neutral-800/50'
                    }
                    ${!reviewMode && !showResult ? 'cursor-pointer hover:border-gray-500' : ''}
                  `}
                  onClick={() => !reviewMode && !showResult && handleOptionSelect(option)}
                >
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium text-sm flex-shrink-0
                      ${isOptionSelected
                        ? isOptionCorrect
                          ? 'bg-emerald-500 text-gray-900'
                          : 'bg-rose-500 text-gray-900'
                        : showAsCorrect
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-600 text-gray-300'
                      }
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-200 text-sm">{option}</span>
                      
                      {showExplanation && isOptionCorrect && currentQuestion.explanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-3 bg-gray-700/50 rounded-lg"
                        >
                          <p className="text-emerald-300 text-xs font-medium mb-1">Explanation:</p>
                          <p className="text-gray-300 text-xs">{currentQuestion.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                    
                    {showExplanation && (
                      <div className="ml-3 flex-shrink-0">
                        {showAsCorrect && (
                          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {showAsIncorrect && (
                          <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {showResult && !reviewMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border ${
                isCorrect 
                  ? 'border-emerald-500/30 bg-emerald-500/5' 
                  : 'border-rose-500/30 bg-rose-500/5'
              }`}
            >
              <p className={`text-sm font-medium ${
                isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}
                {isCorrect ? 'Well done!' : 'The correct answer is highlighted.'}
              </p>
            </motion.div>
          )}
        </motion.div>

        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">
            Score: <span className="text-gray-300 font-medium">{score}</span> / {dailyQuizzes.length}
          </p>
          
          {showResult && !reviewMode && (
            <button
              onClick={handleNextQuestion}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-3 rounded-lg transition-colors duration-200"
            >
              {currentQuestionIndex < dailyQuizzes.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyQuiz;