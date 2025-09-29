import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const QuizReview = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [quizSession, setQuizSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuizSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (location.state?.quizSession) {
          // Use passed session data
          setQuizSession(location.state.quizSession);
        } else if (sessionId) {
          // Fetch session data from API
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/quiz/session/${sessionId}`);
          if (res.data.ok) {
            setQuizSession(res.data.session);
          } else {
            setError('Quiz session not found');
          }
        } else {
          setError('No quiz session specified');
        }
      } catch (error) {
        console.error('Error loading quiz session:', error);
        setError('Failed to load quiz session');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizSession();
  }, [sessionId, location.state]);

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quizSession?.questions?.length - 1)) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-emerald-400 border-emerald-400/30';
      case 'medium': return 'text-amber-400 border-amber-400/30';
      case 'hard': return 'text-rose-400 border-rose-400/30';
      default: return 'text-neutral-400 border-neutral-400/30';
    }
  };

  const getDifficultyBgColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-emerald-400/10';
      case 'medium': return 'bg-amber-400/10';
      case 'hard': return 'bg-rose-400/10';
      default: return 'bg-neutral-400/10';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-4">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-16 w-16 border-4 border-neutral-600 border-t-amber-500 mx-auto mb-6"
          ></motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-300 text-lg font-medium"
          >
            Loading quiz review...
          </motion.p>
        </div>
      </div>
    );
  }

  if (error || !quizSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-neutral-800/70 backdrop-blur-md border border-neutral-700 rounded-2xl p-8 text-center max-w-md w-full shadow-xl"
        >
          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-neutral-200 text-xl font-semibold mb-3">Quiz Not Found</h3>
          <p className="text-neutral-400 mb-6">{error || 'The quiz session could not be loaded.'}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/challenges')}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-lg transition-colors font-medium"
            >
              Back to Challenges
            </button>
            <button
              onClick={() => navigate('/daily-quiz')}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 px-4 py-3 rounded-lg transition-colors font-medium"
            >
              New Quiz
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quizSession.questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / quizSession.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Review</h1>
            <p className="text-neutral-400">
              Completed on {new Date(quizSession.date).toLocaleDateString()} • Score: {quizSession.score}/{quizSession.totalQuestions}
            </p>
          </div>
          <Link 
            to="/challenges"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Challenges
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-neutral-500">
              Question {currentQuestionIndex + 1} of {quizSession.questions.length}
            </span>
            <span className="text-xs text-neutral-500">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="bg-neutral-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-neutral-300 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-4">
            <span className="text-neutral-400 text-sm">
              Score: <span className="text-amber-400 font-semibold">{quizSession.score}/{quizSession.totalQuestions}</span>
            </span>
          </div>

          <button
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === quizSession.questions.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-700 hover:bg-neutral-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-neutral-300 font-medium"
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
          className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700 rounded-2xl p-6 mb-6 shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <span className="text-neutral-500 text-sm">
              Question {currentQuestionIndex + 1}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getDifficultyColor(currentQuestion.difficulty)} ${getDifficultyBgColor(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          <h2 className="text-lg md:text-xl text-neutral-100 font-medium mb-6 leading-relaxed">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isCorrectAnswer = option === currentQuestion.answer;
              const isUserAnswer = option === currentQuestion.chosenAnswer;
              const isUserCorrect = currentQuestion.isCorrect;
              
              return (
                <motion.div
                  key={index}
                  className={`w-full p-4 rounded-xl border transition-all duration-200 ${
                    isCorrectAnswer
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : isUserAnswer && !isUserCorrect
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-neutral-600 bg-neutral-700/30'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium text-sm flex-shrink-0 ${
                      isCorrectAnswer
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : isUserAnswer && !isUserCorrect
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                        : 'bg-neutral-600/50 text-neutral-300'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-neutral-200 text-sm md:text-base">{option}</span>
                    </div>
                    
                    <div className="ml-3 flex-shrink-0">
                      {isCorrectAnswer && (
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
                      {isUserAnswer && !isUserCorrect && (
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
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Explanation */}
          {currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-4 bg-neutral-700/50 rounded-lg border border-neutral-600/50"
            >
              <p className="text-emerald-300 text-xs font-medium mb-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Explanation:
              </p>
              <p className="text-neutral-300 text-sm">{currentQuestion.explanation}</p>
            </motion.div>
          )}

          {/* Result Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-xl border ${
              currentQuestion.isCorrect 
                ? 'border-emerald-500/30 bg-emerald-500/10' 
                : 'border-rose-500/30 bg-rose-500/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentQuestion.isCorrect 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                {currentQuestion.isCorrect ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  currentQuestion.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {currentQuestion.isCorrect 
                    ? 'You answered correctly!' 
                    : `Your answer: "${currentQuestion.chosenAnswer}"`}
                </p>
                {!currentQuestion.isCorrect && (
                  <p className="text-neutral-400 text-xs mt-1">
                    Correct answer: "{currentQuestion.answer}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Navigation */}
        <div className="flex justify-center gap-2 mb-8">
          {quizSession.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentQuestionIndex
                  ? 'bg-amber-500'
                  : quizSession.questions[index].isCorrect
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
              title={`Question ${index + 1}: ${quizSession.questions[index].isCorrect ? 'Correct' : 'Incorrect'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizReview;