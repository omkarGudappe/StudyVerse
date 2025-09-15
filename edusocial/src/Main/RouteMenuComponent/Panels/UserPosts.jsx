import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const UserPosts = ({ userId, getPostLength }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const videoRefs = useRef({});

    useEffect(() => {
        const fetchUsersPosts = async () => {
            if (!userId) return;
            
            setLoading(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/usersPosts/${userId}`);
                
                if (res.data.ok) {
                    setPosts(res.data.UserPosts);
                    getPostLength(res.data.UserPosts.length)
                } else {
                    setError('Failed to fetch posts');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsersPosts();
    }, [userId]);

    const handleVideoClick = (postId, e) => {
        e.stopPropagation();
        const video = videoRefs.current[postId];
        
        if (video) {
            if (video.paused) {
                video.play();
                setActiveVideo(postId);
            } else {
                video.pause();
                setActiveVideo(null);
            }
        }
    };

    const handleVideoPlay = (postId) => {
        setActiveVideo(postId);
    };

    const handleVideoPause = (postId) => {
        setActiveVideo(null);
    };

    // Handle click outside video to pause
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (activeVideo && !e.target.closest('.video-container')) {
                const video = videoRefs.current[activeVideo];
                if (video && !video.paused) {
                    video.pause();
                    setActiveVideo(null);
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [activeVideo]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-amber-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg mb-4">Failed to load posts</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-purple-700 rounded-lg hover:bg-purple-600 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="bg-neutral-900 rounded-2xl p-8 max-w-md mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-neutral-400">This user hasn't shared any study materials.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-6">
            <h2 className="text-2xl font-bold mb-6 px-4 text-amber-100 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Study Materials and Posts
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
                {posts.map((post) => (
                    <div key={post._id} className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-700/50 shadow-lg transition-all duration-300 hover:shadow-purple-500/10 hover:border-purple-500/30">
                        <div className="p-4">
                            {post.heading && (
                                <h3 className="text-lg font-semibold text-amber-100 mb-2 line-clamp-2">{post.heading}</h3>
                            )}
                            
                            <p className="text-xs text-neutral-400 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        
                        {post.files?.url && (
                            <div className="mb-4 mx-4 rounded-xl overflow-hidden">
                                {post.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                                    <img
                                        src={post.files.url}
                                        alt={post.heading || 'Study material'}
                                        className="w-full h-auto max-h-80 object-cover rounded-xl"
                                        loading="lazy"
                                    />
                                ) : post.files.url.match(/\.(mp4|webm|ogg)$/) ? (
                                    <div className='video-container relative group rounded-xl overflow-hidden'>
                                        <video
                                            ref={el => {
                                                if (el) {
                                                    videoRefs.current[post._id] = el;
                                                }
                                            }}
                                            data-video-id={post._id}
                                            src={post.files.url}
                                            className="w-full h-auto max-h-80 object-contain cursor-pointer bg-black"
                                            playsInline
                                            onClick={(e) => handleVideoClick(post._id, e)}
                                            onPlay={() => handleVideoPlay(post._id)}
                                            onPause={() => handleVideoPause(post._id)}
                                            poster={post.thumbnail || ''}
                                        />
                                        {activeVideo !== post._id && (
                                            <div 
                                                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${activeVideo === post._id ? 'opacity-0' : 'opacity-100'}`}
                                                onClick={(e) => handleVideoClick(post._id, e)}
                                            >
                                                <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm border border-white/10 cursor-pointer transform transition-transform duration-300 group-hover:scale-110">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="absolute bottom-2 left-2 bg-black/70 rounded-full px-3 py-1 text-xs text-white backdrop-blur-sm flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Click to {activeVideo === post._id ? 'pause' : 'play'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-700 p-6 rounded-xl text-center">
                                        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-2xl mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-semibold text-white mb-2">Study Document</h4>
                                        <p className="text-neutral-300 mb-4 text-sm">This post contains a study document</p>
                                        <a
                                            href={post.files.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full hover:from-amber-400 hover:to-amber-500 transition-all duration-300 text-white font-medium text-sm shadow-lg hover:shadow-amber-500/30"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download File
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {post.description && (
                            <div className="px-4 pb-4">
                                <p className="text-sm text-neutral-300 line-clamp-3">{post.description}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserPosts;