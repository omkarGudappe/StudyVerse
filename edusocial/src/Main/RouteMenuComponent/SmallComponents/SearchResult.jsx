import React from 'react'
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const SearchResult = ({isLoading , error, searchResults = [] , searchTerm , title, onClose}) => {
  return (
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        ) : searchResults.length === 0 && searchTerm ? (
          <div className="text-center py-12 text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No users found for "{searchTerm}"</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3">
            <p className="text-neutral-400 text-sm mb-4">
              Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.map((user, index) => (
              <motion.div
                  key={user._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="cursor-pointer flex items-center gap-4 p-4 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-all duration-200 group"
                >
                <Link
                  to={`/${title}/${encodeURIComponent(user?.username)}`}
                  onClick={onClose}
                  className="cursor-pointer flex items-center w-full gap-4 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center overflow-hidden border-2 border-neutral-700 group-hover:border-purple-500 transition-colors">
                      {user?.UserProfile?.avatar?.url ? (
                        <img
                          src={user.UserProfile.avatar.url}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold text-lg">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold truncate">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-neutral-400 text-sm truncate">{user?.username}</p>
                    {user?.education && (
                      <p className="text-neutral-500 text-xs mt-1 truncate">
                        {user?.education?.split(',')[0]}
                      </p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>Search for users by name or username</p>
          </div>
        )}
      </div>
  )
}

export default SearchResult
