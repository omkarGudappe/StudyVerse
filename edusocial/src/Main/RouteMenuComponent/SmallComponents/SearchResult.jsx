import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserDataContextExport } from "../CurrentUserContexProvider";

const SearchResult = ({
  isLoading, 
  error, 
  searchResults = {}, 
  searchTerm, 
  title, 
  onClose,
  pagination,
  onLoadMore
}) => {
  const { ProfileData } = UserDataContextExport();
  const [activeTab, setActiveTab] = useState('users');

  const usersData = searchResults.users || [];
  const notesData = searchResults.notes || [];
  const lessonsData = searchResults.lessons || [];

  const getActiveData = () => {
    switch (activeTab) {
      case 'notes': return notesData;
      case 'lessons': return lessonsData;
      default: return usersData;
    }
  };

  const getResultCount = () => {
    switch (activeTab) {
      case 'notes': return notesData.length;
      case 'lessons': return lessonsData.length;
      default: return usersData.length;
    }
  };

  const getHasMore = () => {
    switch (activeTab) {
      case 'notes': return pagination?.hasMore?.notes || false;
      case 'lessons': return pagination?.hasMore?.lessons || false;
      default: return pagination?.hasMore?.users || false;
    }
  };

  const getResultText = () => {
    const count = getResultCount();
    const type = activeTab === 'notes' ? 'note' : activeTab === 'lessons' ? 'lesson' : 'user';
    return `${count} ${type}${count !== 1 ? 's' : ''} found`;
  };

  const UserCard = ({ user, index }) => (
    <motion.div
      key={user._id || index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer group"
    >
      <Link
        to={ProfileData?._id === user?._id ? `/profile` : `/${title}/${encodeURIComponent(user?.username)}`}
        onClick={onClose}
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-2xl hover:from-neutral-750 hover:to-neutral-800 transition-all duration-300 border border-neutral-700 hover:border-purple-500/50 shadow-lg hover:shadow-xl"
      >
        <div className="relative">
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center overflow-hidden border-2 border-neutral-700 group-hover:border-purple-500 transition-all duration-300 shadow-lg">
            {user?.UserProfile?.avatar?.url ? (
              <img
                src={user.UserProfile.avatar.url}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold truncate text-sm md:text-base">
              {user?.firstName} {user?.lastName}
            </h3>
            {ProfileData?._id === user?._id && (
              <span className="px-2 py-1 bg-purple-600 text-xs text-white rounded-full">You</span>
            )}
          </div>
          <p className="text-neutral-300 text-xs md:text-sm truncate mb-1">{user?.username}</p>
          {user?.education && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
              <span className="truncate">{user?.education?.standard} {user?.education?.degree}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );

  const NoteCard = ({ note, index }) => (
    <motion.div
      key={note._id || index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer group"
    >
      <Link
        to={`/notes/${note._id}`}
        onClick={onClose}
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-neutral-800 to-neutral-900 rounded-2xl transition-all duration-300 border border-neutral-700 "
      >
        <div className="relative">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border-2 border-neutral-700 group-hover:border-blue-400 transition-all duration-300 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold truncate text-sm md:text-base mb-1">{note.title}</h3>
          <p className="text-neutral-300 text-xs md:text-sm truncate mb-2">{note.description}</p>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
            </svg>
            <span>By {note.author?.firstName} {note.author?.lastName}</span>
          </div>
        </div>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );

  const LessonCard = ({ lesson, index }) => (
    <motion.div
      key={lesson._id || index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.001, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer group"
    >
      <Link
        to={`/video?l=${lesson._id}`}
        onClick={onClose}
        className="block bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl transition-all duration-500 border overflow-hidden"
      >
        <div className="relative">
          <div className="aspect-video w-full bg-neutral-900 relative overflow-hidden">
            {lesson?.files?.url ? (
              <>
                <video 
                  className="w-full h-full object-cover transition-transform duration-700"
                  src={lesson.files.url}
                  poster={lesson.thumbnail || ''}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
                <div className="absolute top-3 right-3">
                  <span className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    {lesson.duration}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex items-center justify-center">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-500">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-white text-sm font-medium">Video Lesson</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-white font-bold text-sm md:text-base leading-tight flex-1 line-clamp-2 group-hover:text-purple-500 transition-colors duration-300">
              {lesson.heading}
            </h3>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <p className="text-neutral-300 text-xs md:text-sm mb-3 line-clamp-2">{lesson.description || lesson.subject}</p>
          
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 bg-neutral-700/80 hover:bg-green-500/20 px-2 py-1 rounded-full text-xs text-neutral-300 transition-all duration-300 border border-neutral-600 hover:border-purple-400/50">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              {lesson.level}
            </span>
            <span className="inline-flex items-center gap-1 bg-neutral-700/80 hover:bg-green-500/20 px-2 py-1 rounded-full text-xs text-neutral-300 transition-all duration-300 border border-neutral-600 hover:border-purple-400/50">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
              {lesson.duration}
            </span>
            {lesson.subject && (
              <span className="inline-flex items-center gap-1 bg-neutral-700/80 hover:bg-green-500/20 px-2 py-1 rounded-full text-xs text-neutral-300 transition-all duration-300 border border-neutral-600 hover:border-purple-400/50">
                {lesson.subject}
              </span>
            )}
          </div>
        </div>
        
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-400/30 rounded-2xl transition-all duration-500 pointer-events-none"></div>
      </Link>
    </motion.div>
  );

   const LoadMoreButton = () => {
    if (!getHasMore() || getResultCount() === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center mt-6"
      >
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </>
          ) : (
            <>
              Load More
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      </motion.div>
    );
  };

  const renderContent = () => {
    const activeData = getActiveData();
    
    if (activeData.length === 0 && searchTerm && !isLoading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-neutral-400"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-neutral-800 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">No results found</p>
          <p className="text-sm">No {activeTab} found for "{searchTerm}"</p>
        </motion.div>
      );
    }

    if (activeData.length > 0) {
      return (
        <div className="space-y-4">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-neutral-300 text-sm font-medium mb-4 flex items-center gap-2"
          >
            <span className="bg-gradient-to-tr from-purple-500 to-amber-500 px-3 py-1 rounded-full text-xs text-white font-bold shadow-lg">
              {getResultCount()}
            </span>
            {getResultText()}
            {getHasMore() && (
              <span className="text-xs text-purple-400 ml-2">• More available</span>
            )}
          </motion.p>
          <div className={`space-y-4 pb-15 ${activeTab === 'lessons' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-3'}`}>
            <AnimatePresence>
              {activeTab === 'users' && usersData.map((user, index) => (
                <UserCard key={`${user._id}-${index}`} user={user} index={index} />
              ))}
              {activeTab === 'notes' && notesData.map((note, index) => (
                <NoteCard key={`${note._id}-${index}`} note={note} index={index} />
              ))}
              {activeTab === 'lessons' && lessonsData.map((lesson, index) => (
                <LessonCard key={`${lesson._id}-${index}`} lesson={lesson} index={index} />
              ))}
            </AnimatePresence>
          </div>
          <LoadMoreButton />
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 text-neutral-400"
      >
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-lg font-medium mb-2">Start searching</p>
        <p className="text-sm">Search for users, notes, or lessons to get started</p>
      </motion.div>
    );
  };

  return (
    <div className="p-4 md:p-6 select-none">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-neutral-400 mt-4">Searching...</p>
        </div>
      ) : error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-red-400"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium">{error}</p>
        </motion.div>
      ) : (
        <>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex bg-neutral-800 p-1 rounded-2xl mb-6 shadow-lg border border-neutral-700"
          >
            {[
              { id: 'users', label: 'Users', color: 'purple'},
              { id: 'notes', label: 'Notes', color: 'purple'},
              { id: 'lessons', label: 'Lessons', color: 'purple'}
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex-1 flex items-center justify-center gap-2 py-1 px-4 rounded-xl transition-all duration-300 font-medium text-sm md:text-base ${
                  activeTab === tab.id 
                    ? `border-0 border-b-4 border-b-purple-600 text-white shadow-lg transform scale-105` 
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-700/50'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
                <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-700 text-neutral-300'
                }`}>
                  {tab.id === 'users' ? usersData.length : tab.id === 'notes' ? notesData.length : lessonsData.length}
                </span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default SearchResult;