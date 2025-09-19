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
  const [streak, setStreak] = useState(0); // New streak counter

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
          // Load streak from localStorage
          const savedStreak = localStorage.getItem('quizStreak');
          if (savedStreak) setStreak(parseInt(savedStreak));
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
      // Update streak if score is perfect
      if (score === dailyQuizzes.length) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem('quizStreak', newStreak.toString());
      } else {
        // Reset streak if not perfect
        setStreak(0);
        localStorage.setItem('quizStreak', '0');
      }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-16 w-16 border-4 border-gray-600 border-t-purple-500 mx-auto mb-6"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 text-lg font-medium mb-2"
          >
            Crafting your daily quiz...
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 text-sm"
          >
            Preparing personalized questions for you
          </motion.p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800/70 backdrop-blur-md border border-gray-700 rounded-2xl p-8 text-center max-w-md w-full shadow-xl"
        >
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-gray-200 text-xl font-semibold mb-3">Quiz Unavailable</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={restartQuiz}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = (score / dailyQuizzes.length) * 100;
    let message, icon, color;
    
    if (percentage === 100) {
      message = 'Perfect score! Amazing work!';
      icon = '🎯';
      color = 'text-emerald-400';
    } else if (percentage >= 80) {
      message = 'Great job! You nailed it!';
      icon = '🌟';
      color = 'text-amber-400';
    } else if (percentage >= 60) {
      message = 'Good effort! Keep practicing.';
      icon = '👍';
      color = 'text-blue-400';
    } else {
      message = 'Keep learning and try again.';
      icon = '📚';
      color = 'text-gray-400';
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-gray-800/70 backdrop-blur-md border border-gray-700 rounded-2xl p-8 text-center max-w-md w-full shadow-xl"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
            {icon}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-100 mb-2">Quiz Completed!</h2>
          {streak > 0 && (
            <div className="inline-flex items-center bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm mb-4">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              {streak} day streak
            </div>
          )}
          
          <div className="bg-gray-700/50 rounded-xl p-6 mb-6 border border-gray-600/50">
            <p className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Your Score</p>
            <div className="text-4xl font-bold text-gray-100 mb-2">
              {score} / {dailyQuizzes.length}
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2.5 mb-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-2.5 rounded-full ${
                  percentage === 100 ? 'bg-emerald-500' : 
                  percentage >= 80 ? 'bg-amber-500' : 
                  percentage >= 60 ? 'bg-blue-500' : 'bg-gray-500'
                }`}
              />
            </div>
            <p className={`text-sm font-medium ${color}`}>
              {message}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Correct</p>
              <p className="text-emerald-400 text-xl font-bold">{score}</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Incorrect</p>
              <p className="text-rose-400 text-xl font-bold">{dailyQuizzes.length - score}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setReviewMode(true);
                setQuizCompleted(false);
                setCurrentQuestionIndex(0);
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-3 rounded-xl transition-all duration-200 border border-gray-600/50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Review
            </button>
            <button
              onClick={restartQuiz}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
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
  const progressPercentage = ((currentQuestionIndex + 1) / dailyQuizzes.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-gray-100 mb-2 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent"
          >
            {reviewMode ? 'Review Mode' : 'Daily Quiz Challenge'}
          </motion.h1>
          <p className="text-gray-500">
            {reviewMode ? 'Learn from your answers' : `Test your knowledge • ${dailyQuizzes.length} questions`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">Question {currentQuestionIndex + 1} of {dailyQuizzes.length}</span>
            <span className="text-xs text-gray-500">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-600 to-amber-500 rounded-full"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-300 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-gray-300">{streak} day streak</span>
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={!reviewMode && !showResult}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-gray-300 font-medium"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-500 text-sm">
              Question {currentQuestionIndex + 1}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getDifficultyColor(currentQuestion.difficulty)} ${getDifficultyBgColor(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-lg md:text-xl text-gray-100 font-medium mb-6 leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isOptionCorrect = option === currentQuestion.answer;
              const isOptionSelected = selectedOption === option;
              const showAsCorrect = showExplanation && isOptionCorrect;
              const showAsIncorrect = showExplanation && isOptionSelected && !isOptionCorrect;
              
              return (
                <motion.div
                  key={index}
                  whileHover={!reviewMode && !showResult ? { scale: 1.02 } : {}}
                  whileTap={!reviewMode && !showResult ? { scale: 0.98 } : {}}
                  className={`w-full p-4 rounded-xl border transition-all duration-200 cursor-pointer
                    ${isOptionSelected
                      ? isOptionCorrect
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-rose-500 bg-rose-500/10'
                      : showAsCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-gray-600 bg-gray-700/30'
                    }
                    ${!reviewMode && !showResult ? 'hover:border-gray-500 hover:bg-gray-700/50' : ''}
                  `}
                  onClick={() => !reviewMode && !showResult && handleOptionSelect(option)}
                >
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium text-sm flex-shrink-0 transition-all
                      ${isOptionSelected
                        ? isOptionCorrect
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                        : showAsCorrect
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-gray-600/50 text-gray-300'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-200 text-sm md:text-base">{option}</span>
                      
                      {showExplanation && isOptionCorrect && currentQuestion.explanation && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.3 }}
                          className="mt-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50"
                        >
                          <p className="text-emerald-300 text-xs font-medium mb-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Explanation:
                          </p>
                          <p className="text-gray-300 text-xs">{currentQuestion.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                    
                    {showExplanation && (
                      <div className="ml-3 flex-shrink-0">
                        {showAsCorrect && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                        {showAsIncorrect && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.div>
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
              className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {isCorrect ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm font-medium ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isCorrect ? 'Correct! Well done!' : 'Incorrect. The right answer is highlighted.'}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Score and Next Button */}
        <div className="text-center">
          <div className="inline-flex items-center bg-gray-700/50 px-4 py-2 rounded-full mb-4 border border-gray-600/50">
            <span className="text-gray-400 text-sm mr-2">Score:</span>
            <span className="text-gray-100 font-medium">{score}</span>
            <span className="text-gray-500 mx-1">/</span>
            <span className="text-gray-500">{dailyQuizzes.length}</span>
          </div>
          
          {showResult && !reviewMode && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNextQuestion}
              className="w-full bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-medium py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/20"
            >
              {currentQuestionIndex < dailyQuizzes.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyQuiz;