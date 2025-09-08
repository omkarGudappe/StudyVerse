import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudyVerseMain = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
        
        if (response.data.ok) {
          setPosts(response.data.posts.reverse());
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, []);

  // useEffect(() => {

  //     const FetchDataFromBackEnd = async () => {
  //       try {
  //         setLoading(true);
  //         const FetchProfileData = await axios.get(`http://localhost:4000/api/user/profile/${FirebaseUid}`);
  //         setProfileData(FetchProfileData.data.userProfile);
  //         setError(null);
  //       } catch (err) {
  //         console.log(err);
  //         setError('Failed to load profile data');
  //       } finally {
  //         setLoading(false);
  //       }
  //     };
  //     FetchDataFromBackEnd();
  // })

  const handleLike = async (postId) => {
    try {
      // Toggle like locally for instant feedback
      const newLikedPosts = new Set(likedPosts);
      if (newLikedPosts.has(postId)) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);

      // Send like to server
      await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`);
      
      // Optional: Refresh posts to get updated like counts
      // const response = await axios.get('http://localhost:4000/api/posts');
      // if (response.data.ok) {
      //   setPosts(response.data.posts);
      // }
    } catch (err) {
      console.error('Error liking post:', err);
      // Revert local change if server request fails
      const revertedLikedPosts = new Set(likedPosts);
      if (revertedLikedPosts.has(postId)) {
        revertedLikedPosts.delete(postId);
      } else {
        revertedLikedPosts.add(postId);
      }
      setLikedPosts(revertedLikedPosts);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('en', { style: 'short' }).format(
      Math.floor((date - new Date()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
          <p>Loading study materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="text-center p-6 bg-neutral-800 rounded-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
            StudyVerse Community
          </h1>
          <p className="text-neutral-400 mt-2">Discover and share study materials</p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-neutral-400 text-lg">No study materials yet</p>
            <p className="text-neutral-500">Be the first to share your notes!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post._id} className="bg-neutral-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                {/* Post Header */}
                <div className="p-4 border-b border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center overflow-hidden justify-center">
                        <img src={post.author?.UserProfile?.avatar?.url} alt={`${post.author?.firstName?.[0] || ''} ${post?.author?.lastName?.[0] || 'U'}`} className='object-cover h-full w-full overflow-hidden' />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {post.author?.firstName || 'Unknown'} {post.author?.lastName || 'User'}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {formatDate(post.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4">
                  {post.heading && (
                    <h2 className="text-xl font-bold mb-3 text-amber-100">{post.heading}</h2>
                  )}
                  {post.description && (
                    <p className="text-neutral-300 mb-4 leading-relaxed">{post.description}</p>
                  )}
                  
                  {post.files?.url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      {post.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                        <img
                          src={post.files.url}
                          alt={post.heading || 'Study material'}
                          className="w-full h-auto max-h-96 object-cover rounded-lg"
                          loading="lazy"
                        />
                      ) : post.files.url.match(/\.(mp4|webm|ogg)$/) ? (
                           <div className='flex justify-center'>
                            <video
                                src={post.files.url}
                                className="w-full h-140 rounded-lg"
                                autoPlay
                              />
                            </div>
                      ) : (
                        <div className="bg-neutral-700 p-6 rounded-lg text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="mt-2 text-neutral-300">Document</p>
                          <a
                            href={post.files.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300 text-sm mt-2 inline-block"
                          >
                            View File
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="p-4 border-t border-neutral-700">
                  <div className="flex items-center gap-6">
                    <button
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(post._id) 
                          ? 'text-red-500 hover:text-red-400' 
                          : 'text-neutral-400 hover:text-red-500'
                      }`}
                      onClick={() => handleLike(post._id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill={likedPosts.has(post._id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                      </svg>
                      <span className="text-sm">
                        {likedPosts.has(post._id) ? 'Liked' : 'Like'}
                      </span>
                    </button>

                    <button className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm">Comment</span>
                    </button>

                    <button className="flex items-center gap-2 text-neutral-400 hover-text-purple-400 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyVerseMain;