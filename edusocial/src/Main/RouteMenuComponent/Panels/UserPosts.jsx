import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import OpenPostModel from "../SmallComponents/OpenPostModel";

const UserPosts = ({ userId, getPostLength, isPrivate = false }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const [hoveredPost, setHoveredPost] = useState(null);
    const videoRefs = useRef({});
    const [openPostModel, setOpenPostModel] = useState({
        status: false,
        id: null
    });

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
        
        // Only fetch posts if account is not private or user has access
        if (!isPrivate) {
            fetchUsersPosts();
        } else {
            setLoading(false);
            setPosts([]);
        }
    }, [userId, isPrivate]);

    const handleViewPost = (postId) => {
        setOpenPostModel({
        status: true,
        id: postId
        });
    };

    const handleClosePostModal = () => {
        setOpenPostModel({
        status: false,
        id: null
        });
    };

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
            <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-amber-100">Loading posts...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16 text-amber-100">
                <div className="bg-neutral-900/80 rounded-2xl p-8 max-w-md mx-auto border border-neutral-700/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg mb-4">Failed to load posts</p>
                    <p className="text-neutral-400 text-sm mb-6">Please check your connection and try again</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 flex items-center justify-center mx-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (isPrivate) {
        return (
            <div className="py-8 mt-8">
                <div className='border-b border-neutral-700/50 mb-8 pb-4'>
                    <h2 className="text-2xl md:text-3xl font-bold px-4 text-amber-100 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        Private Content
                    </h2>
                </div>
                
                <div className="bg-gradient-to-br from-neutral-900/70 to-neutral-950/80 rounded-2xl p-8 max-w-3xl mx-auto border border-neutral-700/30 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-neutral-950/50 z-0"></div>
                    
                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl mb-6 border border-purple-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-amber-100">This account is private</h3>
                        <p className="text-neutral-400 mb-6 max-w-md mx-auto">Connect with this user to view their study materials and posts.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-40 blur-xs mt-8">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="bg-neutral-800/30 rounded-xl p-4 h-40 flex items-center justify-center border border-neutral-700/20">
                                    <div className="text-center">
                                        <div className="bg-neutral-700/30 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-neutral-500 text-sm">Private content</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 rounded-2xl p-10 max-w-md mx-auto border border-neutral-700/30">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-amber-100">No posts yet</h3>
                    <p className="text-neutral-400 mb-2">This user hasn't shared any study materials.</p>
                    <p className="text-neutral-500 text-sm">Check back later for new content</p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8 mt-8">
            <div className='border-b border-neutral-700/50 mb-8 pb-4'>
                <h2 className="text-2xl md:text-3xl font-bold px-4 text-amber-100 flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    Study Materials and Posts
                </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {posts.map((post) => (
                    <div 
                        key={post._id} 
                        className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-2xl overflow-hidden border border-neutral-700/30 shadow-lg transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-500/50 hover:translate-y-[-4px] group"
                        onMouseEnter={() => setHoveredPost(post._id)}
                        onMouseLeave={() => setHoveredPost(null)}
                    >
                        <div className="p-5">
                            {post.heading && (
                                <h3 className="text-lg font-semibold text-amber-100 mb-3 line-clamp-2 group-hover:text-purple-200 transition-colors">{post.heading}</h3>
                            )}
                            
                            <p className="text-xs text-neutral-400 mb-3 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        
                        {post.files?.url && (
                            <div className="mb-4 mx-4 rounded-xl overflow-hidden">
                                {post.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                                    <div className="relative overflow-hidden rounded-xl">
                                        <img
                                            src={post.files.url}
                                            alt={post.heading || 'Study material'}
                                            className="w-full h-auto max-h-80 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <button 
                                                onClick={() => handleViewPost(post._id)}
                                                className="px-4 py-2 bg-purple-600/90 text-white rounded-lg text-sm font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                                            >
                                                View Content
                                            </button>
                                        </div>
                                    </div>
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
                                        
                                        <div className="absolute bottom-3 left-3 bg-black/70 rounded-full px-3 py-1 text-xs text-white backdrop-blur-sm flex items-center transition-opacity duration-300 opacity-90">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Click to {activeVideo === post._id ? 'pause' : 'play'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-neutral-800 to-neutral-700 p-6 rounded-xl text-center group-hover:from-neutral-700 group-hover:to-neutral-600 transition-all duration-300">
                                        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-2xl mb-4 group-hover:bg-amber-500/30 transition-colors">
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
                                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full hover:from-amber-400 hover:to-amber-500 transition-all duration-300 text-white font-medium text-sm shadow-lg hover:shadow-amber-500/30 group-hover:shadow-amber-500/50"
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
                       
                       <div className='px-5 pb-4 flex justify-end items-center'>
                         <button 
                            className='font-medium text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 shadow-md hover:shadow-purple-500/30 flex items-center'
                            onClick={() => handleViewPost(post._id)}
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                         </button>
                       </div>
                    </div>
                    
                ))}
            </div>
            <OpenPostModel 
                open={openPostModel.status} 
                onClose={handleClosePostModal} 
                Id={openPostModel.id} 
            />
        </div>
    );
};

export default UserPosts;