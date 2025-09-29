import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserDataContextExport } from './CurrentUserContexProvider';
import axios from 'axios';

const Challenges = () => {
  const { ProfileData } = UserDataContextExport();
  const [activeTab, setActiveTab] = useState('flashcards');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    flashcardsCreated: 12,
    quizzesCompleted: 0,
    streak: 5,
    points: 1250
  });
  const [quizHistory, setQuizHistory] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);

  // Mock flashcard sets data
  const flashcardSets = [
    { 
      id: 1, 
      title: 'JavaScript Basics', 
      cards: 15, 
      difficulty: 'Beginner', 
      progress: 75,
      category: 'Programming',
      color: 'from-blue-500 to-cyan-400'
    },
    { 
      id: 2, 
      title: 'React Hooks Mastery', 
      cards: 20, 
      difficulty: 'Intermediate', 
      progress: 40,
      category: 'Web Development',
      color: 'from-purple-500 to-pink-400'
    },
    { 
      id: 3, 
      title: 'CSS Grid Layout', 
      cards: 12, 
      difficulty: 'Beginner', 
      progress: 100,
      category: 'Design',
      color: 'from-green-500 to-emerald-400'
    },
    { 
      id: 4, 
      title: 'Data Structures', 
      cards: 25, 
      difficulty: 'Advanced', 
      progress: 30,
      category: 'Computer Science',
      color: 'from-orange-500 to-red-400'
    }
  ];

  useEffect(() => {
    console.log("Fetching quiz data for user:", ProfileData?._id);
    if(!ProfileData?._id) return;
    
    const fetchQuizHistory = async () => {
      try {
        setLoadingQuizzes(true);
        console.log("Fetching quiz history...");
        const userId = ProfileData._id;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/quiz/${userId}`);

        if(res.data.ok) {
          setQuizHistory(res.data.quizHistory || []);
          setStats(prevStats => ({
            ...prevStats,
            quizzesCompleted: res.data.totalCompleted || 0
          }));
          console.log("Quiz history loaded:", res.data.quizHistory?.length, "quizzes");
        } else {
          console.log("No quiz data found");
          setQuizHistory([]);
        }
      } catch(err) {
        console.log("Error fetching quiz history:", err.message);
        setQuizHistory([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    
    fetchQuizHistory();
  }, [ProfileData]);

  // Transform quiz history for display
  const transformQuizHistory = () => {
    return quizHistory.map((session, index) => ({
      id: session.sessionId || `session-${index + 1}`,
      title: `Daily Quiz - ${new Date(session.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })}`,
      questions: session.totalQuestions || (session.questions ? session.questions.length : 0),
      time: Math.ceil((session.totalQuestions || (session.questions ? session.questions.length : 0)) * 1.5),
      completed: true,
      score: session.score || 0,
      category: 'Daily Challenge',
      difficulty: getOverallDifficulty(session.questions),
      sessionData: session,
      date: session.date
    }));
  };

  const getOverallDifficulty = (questions) => {
    if (!questions || questions.length === 0) return 'Medium';
    
    const difficulties = questions.map(q => q.difficulty).filter(Boolean);
    if (difficulties.length === 0) return 'Medium';
    
    const difficultyCount = {
      easy: difficulties.filter(d => d.toLowerCase().includes('easy')).length,
      medium: difficulties.filter(d => d.toLowerCase().includes('medium')).length,
      hard: difficulties.filter(d => d.toLowerCase().includes('hard')).length
    };
    
    if (difficultyCount.hard > difficultyCount.easy && difficultyCount.hard > difficultyCount.medium) 
      return 'Hard';
    if (difficultyCount.medium >= difficultyCount.easy && difficultyCount.medium >= difficultyCount.hard) 
      return 'Medium';
    return 'Easy';
  };

  const handleCreateFlashcard = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Creating new flashcard set...');
    }, 1000);
  };

  const getDifficultyBadgeColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'easy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'intermediate': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'advanced': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'hard': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    }
  };

  const FlashcardCard = ({ flashcard }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30 hover:border-purple-500/30 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
            {flashcard.title}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadgeColor(flashcard.difficulty)} border`}>
              {flashcard.difficulty}
            </span>
            <span className="text-neutral-400 text-sm">• {flashcard.cards} cards</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-neutral-400 mb-2">
          <span>Progress</span>
          <span>{flashcard.progress}%</span>
        </div>
        <div className="w-full bg-neutral-700/50 rounded-full h-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${flashcard.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
      </div>
      
      <button className="w-full bg-neutral-700/50 hover:bg-neutral-700/70 text-neutral-200 py-2 rounded-xl text-sm font-medium transition-colors group-hover:bg-purple-500/20 group-hover:text-purple-300">
        Continue Studying
      </button>
    </motion.div>
  );

  const QuizCard = ({ quiz }) => (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30 hover:border-amber-500/30 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-300 transition-colors">
            {quiz.title}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadgeColor(quiz.difficulty)} border`}>
              {quiz.difficulty}
            </span>
            <span className="text-neutral-400 text-sm">• {quiz.questions} questions</span>
            <span className="text-neutral-400 text-sm">• {quiz.time} min</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {quiz.completed ? (
            <>
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-emerald-400 font-semibold">{quiz.score}%</div>
                <div className="text-neutral-400 text-xs">Completed</div>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-amber-400 font-semibold">Start</div>
                <div className="text-neutral-400 text-xs">Not attempted</div>
              </div>
            </>
          )}
        </div>
        
        <Link 
          to={quiz.completed ? `/challenges/quiz/review/${quiz.id}` : '/daily-quiz'}
          state={quiz.completed ? { quizSession: quiz.sessionData } : null}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            quiz.completed 
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
          }`}
        >
          {quiz.completed ? 'Review' : 'Start Quiz'}
        </Link>
      </div>
    </motion.div>
  );

  const displayQuizzes = transformQuizHistory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-700/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-amber-500 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                  Study Challenges
                </h1>
                <p className="text-sm text-neutral-400">Test your knowledge and track your progress</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.flashcardsCreated}</div>
                <div className="text-xs text-neutral-400">Flashcards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{stats.quizzesCompleted}</div>
                <div className="text-xs text-neutral-400">Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.streak}</div>
                <div className="text-xs text-neutral-400">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{stats.points}</div>
                <div className="text-xs text-neutral-400">Points</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-neutral-800/50 rounded-2xl p-1 backdrop-blur-sm border border-neutral-700/30 mb-8">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'flashcards'
                ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700/30'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Flashcards</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'quizzes'
                ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-700/30'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Quizzes</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'flashcards' ? (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Flashcards Header */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-600/20 to-amber-400/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/30"
              >
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <h2 className="text-2xl font-bold text-white mb-2">Create Flashcard Set</h2>
                    <p className="text-neutral-300 mb-4">
                      Create interactive flashcards and share them with peers. Make learning fun and collaborative!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Interactive</span>
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm">Shareable</span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Collaborative</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateFlashcard}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-purple-500/25"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create New Set</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Flashcards Grid */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-6">Your Flashcard Sets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {flashcardSets.map((flashcard) => (
                    <FlashcardCard key={flashcard.id} flashcard={flashcard} />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quizzes Header */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-amber-600/20 to-orange-400/20 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-amber-500/30"
              >
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-500/20 rounded-xl">
                        <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Daily Quiz Challenge</h2>
                        <p className="text-amber-300 text-sm">New questions every day!</p>
                      </div>
                    </div>
                    <p className="text-neutral-300 mb-4">
                      Test your knowledge with personalized daily quizzes. Review your past attempts and track your progress!
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-neutral-300">Personalized questions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-neutral-300">Progress tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-neutral-300">Review past attempts</span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    to="/daily-quiz"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-amber-500/25"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Start Daily Quiz</span>
                  </Link>
                </div>
              </motion.div>

              {/* Quizzes Grid */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-6">
                  Your Quiz History ({displayQuizzes.length} completed)
                </h3>
                
                {loadingQuizzes ? (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="rounded-full h-16 w-16 border-4 border-neutral-600 border-t-amber-500 mx-auto mb-4"
                    ></motion.div>
                    <p className="text-neutral-300">Loading your quiz history...</p>
                  </div>
                ) : displayQuizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-neutral-300 mb-2">No quizzes completed yet</h4>
                    <p className="text-neutral-400 mb-6">Complete your first daily quiz to see your history here!</p>
                    <Link 
                      to="/daily-quiz"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Your First Quiz
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayQuizzes.map((quiz) => (
                      <QuizCard key={quiz.id} quiz={quiz} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Stats */}
        <div className="md:hidden mt-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-800/50 rounded-xl p-4 text-center border border-neutral-700/30">
              <div className="text-2xl font-bold text-purple-400">{stats.flashcardsCreated}</div>
              <div className="text-xs text-neutral-400">Flashcards</div>
            </div>
            <div className="bg-neutral-800/50 rounded-xl p-4 text-center border border-neutral-700/30">
              <div className="text-2xl font-bold text-amber-400">{stats.quizzesCompleted}</div>
              <div className="text-xs text-neutral-400">Quizzes</div>
            </div>
            <div className="bg-neutral-800/50 rounded-xl p-4 text-center border border-neutral-700/30">
              <div className="text-2xl font-bold text-green-400">{stats.streak}</div>
              <div className="text-xs text-neutral-400">Day Streak</div>
            </div>
            <div className="bg-neutral-800/50 rounded-xl p-4 text-center border border-neutral-700/30">
              <div className="text-2xl font-bold text-cyan-400">{stats.points}</div>
              <div className="text-xs text-neutral-400">Points</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;