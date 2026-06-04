import React, { useState, useEffect, useRef, useCallback } from 'react'
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

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    const observer = useRef();
    const lastPostElementRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore]);

    const fetchUsersPosts = async (pageNum = 1, isLoadMore = false) => {
        if (!userId) return;
        
        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setInitialLoad(true);
        }

        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/usersPosts/${userId}?page=${pageNum}&limit=6`);
            
            if (res.data.ok) {
                const newPosts = res.data.UserPosts;
                
                if (isLoadMore) {
                    setPosts(prevPosts => [...prevPosts, ...newPosts]);
                } else {
                    setPosts(newPosts);
                    getPostLength(res.data.totalCount || newPosts.length);
                }

                if (newPosts.length < 6) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            } else {
                setError('Failed to fetch posts');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setInitialLoad(false);
        }
    };

    useEffect(() => {
        // Reset states when userId changes
        setPosts([]);
        setPage(1);
        setHasMore(true);
        setError(null);

        // Only fetch posts if account is not private or user has access
        if (!isPrivate) {
            fetchUsersPosts(1, false);
        } else {
            setLoading(false);
            setPosts([]);
            setInitialLoad(false);
        }
    }, [userId, isPrivate]);

    useEffect(() => {
        if (page > 1 && !isPrivate) {
            fetchUsersPosts(page, true);
        }
    }, [page]);

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

    // Skeleton loading component
    const PostSkeleton = ({ isLast = false }) => (
        <div 
            ref={isLast ? lastPostElementRef : null}
            className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-2xl overflow-hidden border border-neutral-700/30 shadow-lg animate-pulse"
        >
            <div className="p-5">
                <div className="h-6 bg-neutral-700 rounded mb-3"></div>
                <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                
                <div className="flex items-center mt-3">
                    <div className="h-3 bg-neutral-700 rounded w-24"></div>
                </div>
            </div>
            
            <div className="mb-4 mx-4 rounded-xl overflow-hidden">
                <div className="w-full h-48 bg-neutral-700 rounded-xl"></div>
            </div>
           
           <div className='px-5 pb-4 flex justify-end items-center'>
             <div className="h-9 bg-neutral-700 rounded-lg w-20"></div>
           </div>
        </div>
    );

    const LoadingSkeleton = () => {
        return (
            <div className="flex justify-center items-center py-16">
                <div className='bg-neutral-900 h-90 rounded-2xl w-sm'>
                    <div className='p-5 flex flex-col gap-3 h-full w-full'>
                        <div className='w-40 h-7 rounded-2xl bg-neutral-800 animate-pulse'></div>
                        <div className='w-30 h-3 rounded-2xl bg-neutral-800 animate-pulse'></div>
                        <div className='h-full w-full bg-neutral-800 rounded-2xl animate-pulse'></div>
                        <div className='flex itmes-end justify-end bg-neutral-800 rounded-2xl animate-pulse h-10 w-20'></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!loading && initialLoad) {
        return (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4'>
                {[1,2,3,4,5,6].map((item) => (
                    <LoadingSkeleton key={item}/>
                ))}
            </div>
        );
    }

    if (error && !loadingMore) {
        return (
            <div className="text-center py-16  text-white">
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
                    <h2 className="text-2xl md:text-3xl font-bold px-4  text-white flex items-center gap-3">
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
                        <h3 className="text-xl font-semibold mb-3  text-white">This account is private</h3>
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

    if (posts.length === 0 && !loading) {
        return (
            <div className="text-center py-16">
                <div className="bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 rounded-2xl p-10 max-w-md mx-auto border border-neutral-700/30">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-2xl mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3  text-white">No posts yet</h3>
                    <p className="text-neutral-400 mb-2">This user hasn't shared any study materials.</p>
                    <p className="text-neutral-500 text-sm">Check back later for new content</p>
                </div>
            </div>
        );
    }

    return (
        <div id="UserPost" className="py-8 mt-8">
            <div className='border-b border-neutral-700/50 mb-8 pb-4'>
                <h2 className="text-2xl md:text-3xl font-bold px-4 text-white flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    Study Materials and Posts
                </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {posts.map((post, index) => (
                    <div 
                        key={post._id} 
                        ref={index === posts.length - 1 ? lastPostElementRef : null}
                        className="relative bg-gradient-to-b from-neutral-900 to-neutral-950 rounded-2xl overflow-hidden border border-neutral-700/30 shadow-lg transition-all duration-300 hover:shadow-purple-500/20 hover:border-purple-500/50 hover:translate-y-[-4px] group"
                        onMouseEnter={() => setHoveredPost(post._id)}
                        onMouseLeave={() => setHoveredPost(null)}
                    >
                        <div className="p-5">
                            {post.heading && (
                                <h3 className="text-lg font-semibold  text-white mb-3 line-clamp-2 group-hover:text-purple-200 transition-colors">{post.heading}</h3>
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
                
                {loadingMore && 
                    Array.from({ length: 3 }).map((_, index) => (
                        <PostSkeleton key={`skeleton-${index}`} isLast={index === 2 && hasMore} />
                    ))
                }
                
                {!hasMore && posts.length > 0 && (
                    <div className="col-span-full text-center py-8">
                        <div className="bg-neutral-900/50 rounded-2xl p-6 max-w-md mx-auto border border-neutral-700/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-white font-medium">You've reached the end</p>
                            <p className="text-neutral-400 text-sm mt-1">No more posts to load</p>
                        </div>
                    </div>
                )}
            </div>
            
            <OpenPostModel 
                open={openPostModel.status} 
                onClose={handleClosePostModal} 
                Id={openPostModel.id}
                posts={posts}
                UpdatePosts={(posts)=> setPosts(posts)}
                from = 'Profile'
            />
        </div>
    );
};

export default UserPosts;