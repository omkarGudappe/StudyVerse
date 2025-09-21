import React, { useState, useEffect, useRef } from 'react';
import { useLessonStore } from '../../StateManagement/StoreNotes';
import { UserDataContextExport } from './CurrentUserContexProvider';
import Lenis from "@studio-freight/lenis";
import Socket from '../../SocketConnection/Socket';
import { Link } from 'react-router-dom';
import Post from '../RouteMenuComponent/Post';

const Lesson = () => {
    const { Lessons, loading, error, hasMore, fetchLesson, loadMoreLesson } = useLessonStore();
    const { ProfileData } = UserDataContextExport();
    const [activeLesson, setActiveLesson] = useState(null);
    const [likedLessons, setLikedLessons] = useState(new Set());
    const [pendingLikes, setPendingLikes] = useState(new Set());
    const [localLikedLessons, setLocalLikedLessons] = useState(new Set());
    const [showSearchBar, setShowSearchBar] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [fullScreenVideo, setFullScreenVideo] = useState(null);
    const [videoStates, setVideoStates] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const videoRefs = useRef({});
    const loadMoreRef = useRef(null);
    const observer = useRef(null);
    const searchRef = useRef(null);
    const [showPost, setShowPost] = useState(false);
    
    // Filter lessons based on search query
    const filteredLessons = Lessons.filter(lesson => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            lesson.heading?.toLowerCase().includes(query) ||
            lesson.description?.toLowerCase().includes(query) ||
            lesson.author?.firstName?.toLowerCase().includes(query) ||
            lesson.author?.lastName?.toLowerCase().includes(query) ||
            lesson.author?.username?.toLowerCase().includes(query)
        );
    });

    // Infinite scroll observer
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };

        const scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !loading) {
                loadMoreLesson();
            }
        }, options);

        if (loadMoreRef.current) {
            scrollObserver.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                scrollObserver.unobserve(loadMoreRef.current);
            }
        };
    }, [hasMore, loading, loadMoreLesson]);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            smoothWheel: true,
            smoothTouch: true,
            touchMultiplier: 1.5,
            wheelMultiplier: 1.2,
            gestureOrientation: 'vertical',
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowSearchBar(false);
            } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
                setShowSearchBar(true);
            }
            
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    useEffect(() => {
        if (ProfileData?._id) {
            fetchLesson(ProfileData._id);
        }
    }, [fetchLesson, ProfileData]);

    useEffect(() => {
        const handler = ({ Fetch }) => {
            if (Fetch) {
                fetchLesson(true);
            }
        };

        Socket.on("FetchAgain", handler);

        return () => {
            Socket.off("FetchAgain", handler);
        };
    }, [fetchLesson]);

    useEffect(() => {
        const handler = ({ lessonId, likes, liked }) => {
            setPendingLikes(prev => {
                const newSet = new Set(prev);
                newSet.delete(lessonId);
                return newSet;
            });

            useLessonStore.getState().updateLessonLikes(lessonId, likes);
            
            if (liked) {
                setLocalLikedLessons(prev => new Set([...prev, lessonId]));
            } else {
                setLocalLikedLessons(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(lessonId);
                    return newSet;
                });
            }
        };

        Socket.on("lesson-like-updated", handler);

        return () => {
            Socket.off("lesson-like-updated", handler);
        };
    }, []);

    useEffect(() => {
        if (Lessons.length > 0 && ProfileData?._id) {
            const userLikedLessons = new Set();
            Lessons.forEach(lesson => {
                if (VerifyLikeServer(lesson._id, lesson?.likes)) {
                    userLikedLessons.add(lesson._id);
                }
            });
            setLocalLikedLessons(userLikedLessons);
        }
    }, [Lessons, ProfileData]);

    // Handle full screen change events
    useEffect(() => {
        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setFullScreenVideo(null);
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: diffDays > 365 ? 'numeric' : undefined
        });
    };

    const handleLike = async (lessonId, lessonAuthorId) => {
        try {
            const UserId = ProfileData?._id;
            if (!UserId) return;
            
            const isCurrentlyLiked = localLikedLessons.has(lessonId);
            
            if (isCurrentlyLiked) {
                setLocalLikedLessons(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(lessonId);
                    return newSet;
                });
            } else {
                setLocalLikedLessons(prev => new Set([...prev, lessonId]));
            }
            
            setPendingLikes(prev => new Set([...prev, lessonId]));
            
            Socket.emit("Handle-user-like", { lessonId, userId: UserId, type: "like", toId: lessonAuthorId });
            
        } catch (err) {
            console.log(err.message);
            setLocalLikedLessons(new Set(localLikedLessons));
            setPendingLikes(prev => {
                const newSet = new Set(prev);
                newSet.delete(lessonId);
                return newSet;
            });
        }
    };

    const VerifyLikeServer = (lessonId, likes) => {
        const userId = ProfileData?._id;
        if (!userId) return false;
        
        return likes.some(like => 
            typeof like === 'object' ? like._id === userId : like === userId
        );
    };

    const VerifyLike = (lessonId, likes) => {
        return localLikedLessons.has(lessonId);
    };

    const isLikePending = (lessonId) => {
        return pendingLikes.has(lessonId);
    };

    // Video control functions
    const togglePlayPause = (lessonId) => {
        const video = videoRefs.current[lessonId];
        if (!video) return;
        
        if (video.paused) {
            video.play();
            setVideoStates(prev => ({
                ...prev,
                [lessonId]: { ...prev[lessonId], playing: true }
            }));
        } else {
            video.pause();
            setVideoStates(prev => ({
                ...prev,
                [lessonId]: { ...prev[lessonId], playing: false }
            }));
        }
    };

    const toggleFullScreen = (lessonId) => {
        const video = videoRefs.current[lessonId];
        if (!video) return;
        
        if (!document.fullscreenElement) {
            setFullScreenVideo(lessonId);
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) {
                video.msRequestFullscreen();
            }
            
            // Play video when entering fullscreen
            if (video.paused) {
                video.play();
                setVideoStates(prev => ({
                    ...prev,
                    [lessonId]: { ...prev[lessonId], playing: true }
                }));
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            setFullScreenVideo(null);
        }
    };

    const handleVideoTimeUpdate = (lessonId, e) => {
        const video = e.target;
        const progress = (video.currentTime / video.duration) * 100;
        
        setVideoStates(prev => ({
            ...prev,
            [lessonId]: {
                ...prev[lessonId],
                progress,
                currentTime: video.currentTime,
                duration: video.duration
            }
        }));
    };

    const handleVideoClick = (lessonId) => {
        if (fullScreenVideo === lessonId) {
            togglePlayPause(lessonId);
        } else {
            toggleFullScreen(lessonId);
        }
    };

    const handleProgressClick = (lessonId, e) => {
        const video = videoRefs.current[lessonId];
        if (!video) return;
        
        const progressBar = e.currentTarget;
        const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
        const progressBarWidth = progressBar.offsetWidth;
        const newTime = (clickPosition / progressBarWidth) * video.duration;
        
        video.currentTime = newTime;
    };

    const toggleMute = (lessonId) => {
        const video = videoRefs.current[lessonId];
        if (!video) return;
        
        video.muted = !video.muted;
        setVideoStates(prev => ({
            ...prev,
            [lessonId]: { ...prev[lessonId], muted: video.muted }
        }));
    };

    const handleVolumeChange = (lessonId, e) => {
        const video = videoRefs.current[lessonId];
        if (!video) return;
        
        const volume = parseFloat(e.target.value);
        video.volume = volume;
        setVideoStates(prev => ({
            ...prev,
            [lessonId]: { ...prev[lessonId], volume, muted: volume === 0 }
        }));
    };

    // Skeleton loader component
    const LessonSkeleton = () => (
        <div className="bg-neutral-800/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-neutral-700/30 animate-pulse">
            {/* Thumbnail Skeleton */}
            <div className="w-full aspect-video bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-t-2xl"></div>
            
            {/* Content Skeleton */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-full w-4/5 mb-2"></div>
                        <div className="h-3 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-full w-3/5 mb-2"></div>
                        <div className="h-3 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-full w-2/5"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (error && Lessons.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center p-4">
                <div className="text-center p-8 bg-neutral-800/70 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Oops! Something went wrong</h2>
                    <p className="text-neutral-300 mb-6">{error}</p>
                    <button 
                        onClick={() => fetchLesson()} 
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/30 font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="lenis min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
            {/* Mobile Search Bar */}
            <div 
                className={`md:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-700/50 ${showSearchBar ? 'translate-y-0' : '-translate-y-full'}`}
            >
                <nav className='h-16 flex items-center px-4'>
                    <img src="/LOGO/StudyVerseLogo2.png" className='h-10 object-contain' alt="StudyVerse" />
                </nav>
                <div className="px-4 pb-3">
                    <div className="flex items-center" ref={searchRef}>
                        <div className="flex-1">
                            <input
                                type="text" 
                                className="bg-neutral-800/80 p-3 w-full rounded-xl placeholder:text-neutral-400 text-white outline-none border border-neutral-700/50 focus:border-blue-500/50 transition-colors"
                                placeholder="Search lessons, topics, or creators..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="ml-2 p-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl hover:from-blue-500 hover:to-cyan-400 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-8 sticky top-0 left-0 px-4 w-auto flex-shrink-0 backdrop-blur-xl bg-neutral-900/80 border-b border-neutral-600 z-40 py-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-7xl mx-auto">
                    <div className='flex items-center justify-between w-full md:w-auto'>
                        <h1 className='text-2xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent'>StudyLessons</h1>
                        <div className="md:hidden">
                            <div className='flex gap-3 items-center'>
                                <button
                                    className='rounded-full bg-neutral-700 p-1 flex gap-2 px-3 cursor-pointer font-bold items-center justify-center'
                                    onClick={() => setShowPost(!showPost)}
                                >
                                    <div className='h-5 w-5 flex items-center justify-center'>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                    </div>
                                    <p className="text-sm">Upload</p>
                                </button>
                                <Link
                                    to='/profile'
                                    className='rounded-full bg-gradient-to-r overflow-hidden from-purple-600 to-amber-500'
                                >
                                    <div className='h-8 w-8'>
                                        <img src={ProfileData?.UserProfile?.avatar?.url} alt="" className='object-cover h-8 w-8' />
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center p-2 w-full lg:max-w-xl max-w-md">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                className="w-full h-full bg-neutral-800/80 pl-5 pr-2 py-2 rounded-bl-full rounded-tl-full px-4 placeholder:text-neutral-400 text-white outline-none border border-r-0 border-neutral-700/50 focus:border-blue-500/50 transition-colors group-focus:border-blue-500/50"
                                placeholder="Search lessons, topics, or creators..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="p-3 transition-all h-full duration-300 bg-neutral-800/80 rounded-tr-full rounded-br-full border border-neutral-700/50 border-l-0 group-focus:border-blue-500/50">
                            <svg xmlns="http://www.w3.org/2000/svg" className='h-4 w-4' fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                    <div className="hidden md:block">
                        <div className='flex gap-3 items-center'>
                            <button
                                className='rounded-full bg-neutral-700 p-1 flex gap-2 px-3 cursor-pointer font-bold items-center justify-center hover:bg-neutral-600 transition-colors'
                                onClick={() => setShowPost(!showPost)}
                            >
                                <div className='h-5 w-5 flex items-center justify-center'>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </div>
                                <p>Upload</p>
                            </button>
                            <Link
                                to='/profile'
                                className='rounded-full bg-gradient-to-r overflow-hidden from-purple-600 to-amber-500 transition-transform hover:scale-105'
                            >
                                <div className='h-8 w-8'>
                                    <img src={ProfileData?.UserProfile?.avatar?.url} alt="" className='object-cover h-8 w-8' />
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl pt-20 md:pt-8 mx-auto px-4 sm:px-6 lg:px-8">
                {filteredLessons.length === 0 && !loading && searchQuery ? (
                    <div className="text-center bg-neutral-800/40 rounded-3xl border border-neutral-700/30 backdrop-blur-sm py-12">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-700/30 rounded-3xl mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-3">No results found</h3>
                        <p className="text-neutral-400 max-w-md mx-auto mb-6">
                            Try different keywords or browse all lessons
                        </p>
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="px-4 py-2 bg-neutral-700/50 rounded-lg hover:bg-neutral-600/50 transition-colors"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : filteredLessons.length === 0 && !loading ? (
                    <div className="text-center bg-neutral-800/40 rounded-3xl border border-neutral-700/30 backdrop-blur-sm py-12">
                        <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-700/30 rounded-3xl mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-3">No lessons yet</h3>
                        <p className="text-neutral-400 max-w-md mx-auto mb-6">
                            Be the first to share educational content with the community
                        </p>
                        <button 
                            onClick={() => setShowPost(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/30 font-medium"
                        >
                            Create Your First Lesson
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading && filteredLessons.length === 0 && (
                            <>
                                <LessonSkeleton />
                                <LessonSkeleton />
                                <LessonSkeleton />
                                <LessonSkeleton />
                                <LessonSkeleton />
                                <LessonSkeleton />
                            </>
                        )}

                        {filteredLessons.map((lesson) => (
                            <div 
                                key={lesson._id}
                                className="bg-neutral-800/40 backdrop-blur-sm relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-neutral-600/50 border border-neutral-700/30 group"
                            >
                                <Link to={`/video?l=${lesson._id}`}>
                                    <div className="relative aspect-video overflow-hidden">
                                        {lesson.files?.url && lesson.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                                            <img
                                                src={lesson.files.url}
                                                alt={lesson.heading || 'Study lesson'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        ) : lesson.files?.url && lesson.files.url.match(/\.(mp4|webm|ogg)$/) ? (
                                            <div className='relative w-full h-full'>
                                                <video
                                                    ref={el => {
                                                        if (el) {
                                                            videoRefs.current[lesson._id] = el;
                                                        }
                                                    }}
                                                    data-video-id={lesson._id}
                                                    src={lesson.files.url}
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    muted
                                                    loop
                                                    playsInline
                                                    poster={lesson.thumbnail || ''}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleVideoClick(lesson._id);
                                                    }}
                                                    onTimeUpdate={(e) => handleVideoTimeUpdate(lesson._id, e)}
                                                    onPlay={() => setVideoStates(prev => ({
                                                        ...prev,
                                                        [lesson._id]: { ...prev[lesson._id], playing: true }
                                                    }))}
                                                    onPause={() => setVideoStates(prev => ({
                                                        ...prev,
                                                        [lesson._id]: { ...prev[lesson._id], playing: false }
                                                    }))}
                                                    onLoadedMetadata={(e) => {
                                                        setVideoStates(prev => ({
                                                            ...prev,
                                                            [lesson._id]: {
                                                                ...prev[lesson._id],
                                                                duration: e.target.duration,
                                                                volume: e.target.volume,
                                                                muted: e.target.muted
                                                            }
                                                        }));
                                                    }}
                                                />
                                                
                                                <div className={`absolute inset-0 bg-black/40 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity ${fullScreenVideo === lesson._id ? 'opacity-100' : ''}`}>
                                                    <div 
                                                        className="w-full h-1 bg-neutral-600/50 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleProgressClick(lesson._id, e);
                                                        }}
                                                    >
                                                        <div 
                                                            className="h-full bg-blue-500 transition-all duration-200"
                                                            style={{ width: `${videoStates[lesson._id]?.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2">
                                                        <div className="flex items-center space-x-3">
                                                            <button 
                                                                className="text-white hover:text-blue-300 cursor-pointer transition-colors"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    togglePlayPause(lesson._id);
                                                                }}
                                                            >
                                                                {videoStates[lesson._id]?.playing ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                            
                                                            <div className="flex items-center space-x-2">
                                                                <button 
                                                                    className="text-white cursor-pointer hover:text-blue-300 transition-colors"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        toggleMute(lesson._id);
                                                                    }}
                                                                >
                                                                    {videoStates[lesson._id]?.muted || videoStates[lesson._id]?.volume === 0 ? (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m-4.5-9.5L12 3v18l-4.5-4.5H4a1 1 0 01-1-1v-7a1 1 0 011-1h3.5z" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="1"
                                                                    step="0.1"
                                                                    value={videoStates[lesson._id]?.muted ? 0 : (videoStates[lesson._id]?.volume || 1)}
                                                                    onChange={(e) => handleVolumeChange(lesson._id, e)}
                                                                    className="w-16 h-1 accent-blue-500 cursor-pointer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            </div>
                                                            
                                                            <span className="text-xs text-neutral-300">
                                                                {videoStates[lesson._id]?.currentTime 
                                                                    ? `${Math.floor(videoStates[lesson._id].currentTime / 60)}:${Math.floor(videoStates[lesson._id].currentTime % 60).toString().padStart(2, '0')}`
                                                                    : '0:00'
                                                                } / {videoStates[lesson._id]?.duration 
                                                                    ? `${Math.floor(videoStates[lesson._id].duration / 60)}:${Math.floor(videoStates[lesson._id].duration % 60).toString().padStart(2, '0')}`
                                                                    : '0:00'
                                                                }
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Fullscreen Button */}
                                                        <button 
                                                            className="text-white hover:text-blue-300 transition-colors"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                toggleFullScreen(lesson._id);
                                                            }}
                                                        >
                                                            {fullScreenVideo === lesson._id ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H9zm0 0v9a1 1 0 001 1h4a1 1 0 001-1V9zm0 0h4m-4 0H9m10 0V5a1 1 0 00-1-1h-4a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1zm0 0v9a1 1 0 01-1 1h-4a1 1 0 01-1-1V9zm0 0h-4" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 8h2a2 2 0 012 2v2" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Link to={`/profile/${lesson.author?.username}`} className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-amber-500">
                                                <img 
                                                    src={lesson.author?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                                    alt={lesson.author?.firstName || 'User'} 
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </Link>
                                        
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/video?l=${lesson._id}`}>
                                                <h3 className="font-semibold text-white truncate hover:text-blue-300 transition-colors">
                                                    {lesson.heading || 'Untitled Lesson'}
                                                </h3>
                                            </Link>
                                            
                                            <Link to={`/profile/${lesson.author?.username}`} className="block">
                                                <p className="text-sm text-neutral-400 hover:text-white transition-colors">
                                                    {lesson.author?.firstName} {lesson.author?.lastName}
                                                </p>
                                            </Link>
                                            
                                            <p className="text-xs text-neutral-500 mt-1">
                                                {formatDate(lesson.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-neutral-300 mt-3 line-clamp-2">
                                        {lesson.description || 'No description provided.'}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-700/50">
                                        <button
                                            className={`flex items-center space-x-1 transition-all duration-300 ${VerifyLike(lesson._id, lesson.likes) ? 'text-red-500' : 'text-neutral-400 hover:text-red-400'}`}
                                            onClick={() => handleLike(lesson._id, lesson.author?._id)}
                                            disabled={isLikePending(lesson._id)}
                                        >
                                            {isLikePending(lesson._id) ? (
                                                <svg className="animate-spin h-5 w-5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : VerifyLike(lesson._id, lesson.likes) ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            )}
                                            <span className="text-sm">{lesson.likes?.length || 0}</span>
                                        </button>
                                        
                                        <Link 
                                            to={`/video?l=${lesson._id}`}
                                            className="text-neutral-400 hover:text-blue-400 transition-colors flex items-center space-x-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <span className="text-sm">{lesson.comments?.length || 0}</span>
                                        </Link>
                                        
                                        <button className="text-neutral-400 hover:text-green-400 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        </button>
                                        
                                        <button className="text-neutral-400 hover:text-amber-400 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div ref={loadMoreRef} className="py-8 flex justify-center">
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full animate-bounce"></div>
                                <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        ) : (
                            <button 
                                onClick={loadMoreLesson}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/30 font-medium"
                            >
                                Load More
                            </button>
                        )}
                    </div>
                )}
            </div>

            {showPost && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="relative bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <button 
                            className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors z-10"
                            onClick={() => setShowPost(!showPost)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <Post ModelCloseClicked={() => setShowPost(!showPost)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lesson;