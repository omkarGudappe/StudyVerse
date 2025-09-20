import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLessonStore } from '../../../StateManagement/StoreNotes';
import { UserDataContextExport } from '../CurrentUserContexProvider';
import Socket from '../../../SocketConnection/Socket';
import Lenis from "@studio-freight/lenis";
import axios from 'axios';

const Video = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getLessonById, loading, error, addCommentToLesson, updateLessonLikes, fetchLesson, Lessons } = useLessonStore();
    const { ProfileData } = UserDataContextExport();
    const [lesson, setLesson] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showComments, setShowComments] = useState(true);
    const [relatedLessons, setRelatedLessons] = useState([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);
    const [isLoadingLesson, setIsLoadingLesson] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [videoQuality, setVideoQuality] = useState('auto');
    const [showNotes, setShowNotes] = useState(false);
    const [userNotes, setUserNotes] = useState('');
    const [savedTimestamps, setSavedTimestamps] = useState([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [peersList, setPeersList] = useState([]);
    const [showTheaterMode, setShowTheaterMode] = useState(false);
    const [playbackRates] = useState([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
    const [videoQualities] = useState(['360p', '480p', '720p', '1080p', 'auto']);
    
    const videoRef = useRef(null);
    const controlsTimeout = useRef(null);
    const containerRef = useRef(null);
    const commentInputRef = useRef(null);
    const notesRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const lessonId = searchParams.get('l');

    // Function to load lesson data
    const loadLesson = useCallback(async (id) => {
        if (!id) return;
        
        setIsLoadingLesson(true);
        try {
            // Try to get from store first
            let lessonData = getLessonById(id);
            
            // If not in store, fetch from server
            if (!lessonData) {
                await fetchLesson(ProfileData?._id);
                lessonData = getLessonById(id);
            }
            
            if (lessonData) {
                setLesson(lessonData);
                setComments(lessonData.comments || []);
                setLikeCount(lessonData.likes?.length || 0);
                setIsLiked(lessonData.likes?.includes(ProfileData?._id) || false);
                fetchRelatedLessons(lessonData.author?._id, lessonData._id);
                
                // Load user notes if available
                loadUserNotes(lessonData._id);
                
                // Reset video state
                if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setIsPlaying(false);
                }
            } else {
                console.error('Lesson not found');
            }
        } catch (err) {
            console.error('Error loading lesson:', err);
        } finally {
            setIsLoadingLesson(false);
        }
    }, [getLessonById, fetchLesson, ProfileData]);

    // Load user notes for this lesson
    const loadUserNotes = async (lessonId) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/lessons/notes/${lessonId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (response.data.success) {
                setUserNotes(response.data.notes || '');
                setSavedTimestamps(response.data.timestamps || []);
            }
        } catch (error) {
            console.log('No saved notes found or error loading notes');
        }
    };

    // Save user notes
    const saveUserNotes = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/lessons/notes`, {
                lessonId: lesson._id,
                notes: userNotes,
                timestamps: savedTimestamps
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
        } catch (error) {
            console.error('Error saving notes:', error);
        }
    };

    // Add timestamp to notes
    const addTimestamp = () => {
        if (!videoRef.current) return;
        
        const timestamp = videoRef.current.currentTime;
        const note = `[${formatTime(timestamp)}] `;
        
        setUserNotes(prev => prev + note);
        setSavedTimestamps(prev => [...prev, { time: timestamp, note: '' }]);
        
        // Auto-save notes
        setTimeout(saveUserNotes, 1000);
    };

    // Jump to specific timestamp
    const jumpToTimestamp = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setIsPlaying(true);
            videoRef.current.play();
        }
    };

    // Fetch peers list for sharing
    const fetchPeersList = async () => {
        const id = ProfileData?._id;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/userConnections/${id}`);
            if (res.data.ok) {
                setPeersList(res.data.Connections);
            }
        } catch (err) {
            console.log(err.message);
        }
    };

    // Share lesson with peer
    const shareLessonWithPeer = async (peerId) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/lessons/share`, {
                lessonId: lesson._id,
                recipientId: peerId,
                senderId: ProfileData._id,
            });

            if (response.data.success) {
                Socket.emit("lesson-shared", {
                    lessonData: lesson,
                    recipientId: peerId,
                    senderId: ProfileData._id,
                });
                
                setShowShareModal(false);
            }
        } catch (error) {
            console.error("Error sharing lesson:", error);
        }
    };

    // Download lesson
    const downloadLesson = async () => {
        if (!lesson.files?.url) return;
        
        setIsDownloading(true);
        setDownloadProgress(0);
        
        try {
            const response = await axios.get(lesson.files.url, {
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setDownloadProgress(percent);
                }
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${lesson.heading || 'lesson'}.${lesson.files.url.split('.').pop()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
        } catch (error) {
            console.error('Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    // Effect to handle lessonId changes
    useEffect(() => {
        if (lessonId) {
            loadLesson(lessonId);
        }
    }, [lessonId, loadLesson]);

    // Effect to handle URL parameter changes
    useEffect(() => {
        const handleUrlChange = () => {
            const newLessonId = new URLSearchParams(window.location.search).get('l');
            if (newLessonId && newLessonId !== lessonId) {
                loadLesson(newLessonId);
            }
        };

        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', handleUrlChange);
        
        return () => {
            window.removeEventListener('popstate', handleUrlChange);
        };
    }, [lessonId, loadLesson]);

    // Lenis smooth scrolling
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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!videoRef.current) return;
            
            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'f':
                    toggleFullScreen();
                    break;
                case 't':
                    setShowTheaterMode(!showTheaterMode);
                    break;
                case 'm':
                    toggleMute();
                    break;
                case 'ArrowRight':
                    seek(5);
                    break;
                case 'ArrowLeft':
                    seek(-5);
                    break;
                case 'ArrowUp':
                    adjustVolume(0.1);
                    break;
                case 'ArrowDown':
                    adjustVolume(-0.1);
                    break;
                case 'n':
                    addTimestamp();
                    break;
                case 'c':
                    setShowComments(!showComments);
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [showTheaterMode, showComments]);

    // Fullscreen change handler
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    // Video event handlers
    useEffect(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            
            const handleTimeUpdate = () => {
                setCurrentTime(video.currentTime);
            };
            
            const handleLoadedMetadata = () => {
                setDuration(video.duration);
            };
            
            const handlePlay = () => {
                setIsPlaying(true);
            };
            
            const handlePause = () => {
                setIsPlaying(false);
            };
            
            const handleEnded = () => {
                setIsPlaying(false);
                setCurrentTime(0);
            };
            
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('play', handlePlay);
            video.addEventListener('pause', handlePause);
            video.addEventListener('ended', handleEnded);
            
            return () => {
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
                video.removeEventListener('ended', handleEnded);
            };
        }
    }, [lesson]);

    // Volume and mute effects
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Auto-hide controls
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
            
            controlsTimeout.current = setTimeout(() => {
                if (isPlaying) {
                    setShowControls(false);
                }
            }, 3000);
        };
        
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('touchstart', handleMouseMove);
            
            return () => {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('touchstart', handleMouseMove);
                if (controlsTimeout.current) {
                    clearTimeout(controlsTimeout.current);
                }
            };
        }
    }, [isPlaying]);

    // Fetch related lessons
    const fetchRelatedLessons = async (authorId, currentLessonId) => {
        if (!authorId) return;
        
        setIsLoadingRelated(true);
        try {
            // Get lessons from store
            const lessons = Lessons || [];
            const related = lessons
                .filter(l => l.author?._id === authorId && l._id !== currentLessonId)
                .slice(0, 3);
            setRelatedLessons(related);
        } catch (error) {
            console.error('Error fetching related lessons:', error);
        } finally {
            setIsLoadingRelated(false);
        }
    };

    // Video control functions
    const togglePlayPause = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if (containerRef.current.webkitRequestFullscreen) {
                containerRef.current.webkitRequestFullscreen();
            } else if (containerRef.current.msRequestFullscreen) {
                containerRef.current.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const seek = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const adjustVolume = (delta) => {
        setVolume(prev => Math.min(1, Math.max(0, prev + delta)));
    };

    const handleProgressClick = (e) => {
        if (videoRef.current) {
            const progressBar = e.currentTarget;
            const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
            const progressBarWidth = progressBar.offsetWidth;
            const newTime = (clickPosition / progressBarWidth) * duration;
            
            videoRef.current.currentTime = newTime;
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const changePlaybackRate = (rate) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
            setShowSpeedMenu(false);
        }
    };

    const changeVideoQuality = (quality) => {
        setVideoQuality(quality);
        setShowQualityMenu(false);
        // In a real app, you would switch video source here
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleLike = async () => {
        if (!ProfileData?._id || !lesson) return;
        
        try {
            const newLikeStatus = !isLiked;
            setIsLiked(newLikeStatus);
            setLikeCount(prev => newLikeStatus ? prev + 1 : prev - 1);
            
            Socket.emit("Handle-user-like", { 
                lessonId: lesson._id, 
                userId: ProfileData._id, 
                type: "like", 
                toId: lesson.author?._id 
            });
            
            updateLessonLikes(lesson._id, newLikeStatus ? [...lesson.likes, ProfileData._id] : lesson.likes.filter(id => id !== ProfileData._id));
        } catch (error) {
            console.error('Error liking lesson:', error);
            setIsLiked(!isLiked);
            setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim() || !ProfileData?._id || !lesson) return;
        
        try {
            const newComment = {
                text: comment,
                user: ProfileData._id,
                createdAt: new Date().toISOString()
            };
            
            setComments(prev => [newComment, ...prev]);
            setComment('');
            
            Socket.emit("lesson-comment", {
                lessonId: lesson._id,
                userId: ProfileData._id,
                comment: newComment.text,
                toId: lesson.author?._id
            });
            
            addCommentToLesson(lesson._id, newComment);
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const navigateToLesson = (newLessonId) => {
        // Update URL without full page reload
        setSearchParams({ l: newLessonId });
        
        // Scroll to top for better UX
        window.scrollTo(0, 0);
    };

    if (loading || isLoadingLesson) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full animate-pulse">
                                <img src="/LOGO/StudyVerseIcon.png" alt="Loading" />
                            </div>
                        </div>
                    </div>
                    <p className="text-lg font-medium mt-4 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                        Loading your lesson...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !lesson) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center p-4">
                <div className="text-center p-8 bg-neutral-800/70 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-white">Lesson Not Found</h2>
                    <p className="text-neutral-300 mb-6">
                        {error || 'The lesson you are looking for does not exist.'}
                    </p>
                    <button 
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-purple-500/30 font-medium"
                    >
                        Back to Lessons
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`lenis min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white ${showTheaterMode ? 'pt-0' : ''}`}>
            {/* Header */}
            {!showTheaterMode && (
                <div className="sticky top-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-700/50">
                    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                        <button 
                            onClick={() => navigate(-1)}
                            className="flex items-center text-neutral-300 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back
                        </button>
                        
                        <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
                            StudyVerse
                        </h1>
                        
                        <div className="w-6"></div>
                    </div>
                </div>
            )}

            <div className={`max-w-7xl mx-auto ${showTheaterMode ? 'px-0' : 'px-4 py-6 lg:py-8'}`}>
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Video Content */}
                    <div className={`${showTheaterMode ? 'w-full' : 'flex-1'}`}>
                        <div 
                            ref={containerRef}
                            className={`relative bg-black rounded-2xl overflow-hidden shadow-xl border border-neutral-700/30 group ${showTheaterMode ? 'rounded-none border-0' : ''}`}
                            onMouseEnter={() => setShowControls(true)}
                            onMouseLeave={() => {
                                if (isPlaying) {
                                    controlsTimeout.current = setTimeout(() => {
                                        setShowControls(false);
                                    }, 2000);
                                }
                            }}
                        >
                            {lesson.files?.url && lesson.files.url.match(/\.(mp4|webm|ogg)$/) ? (
                                <video
                                    ref={videoRef}
                                    src={lesson.files.url}
                                    className="w-full h-full aspect-video object-contain"
                                    poster={lesson.thumbnail}
                                    onClick={togglePlayPause}
                                />
                            ) : (
                                <div className="w-full aspect-video bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            )}

                            {/* Video Controls Overlay */}
                            <div 
                                className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Progress Bar */}
                                <div 
                                    className="w-full h-2 bg-neutral-600/50 cursor-pointer group-hover:h-3 transition-all"
                                    onClick={handleProgressClick}
                                >
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-200"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    ></div>
                                </div>
                                
                                {/* Control Bar */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center space-x-4">
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={togglePlayPause}
                                        >
                                            {isPlaying ? (
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
                                                className="text-white cursor-pointer hover:text-purple-300 transition-colors"
                                                onClick={toggleMute}
                                            >
                                                {isMuted || volume === 0 ? (
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
                                                value={isMuted ? 0 : volume}
                                                onChange={handleVolumeChange}
                                                className="w-16 h-1 accent-purple-500 cursor-pointer"
                                            />
                                        </div>
                                        
                                        <span className="text-sm text-neutral-300">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                        {/* Timestamp Button */}
                                        <button 
                                            className="text-white hover:text-amber-300 transition-colors"
                                            onClick={addTimestamp}
                                            title="Add timestamp (N)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        
                                        {/* Playback Speed */}
                                        <div className="relative">
                                            <button 
                                                className="text-white hover:text-purple-300 transition-colors text-sm font-medium"
                                                onClick={() => {setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false);}}
                                            >
                                                {playbackRate}x
                                            </button>
                                            
                                            {showSpeedMenu && (
                                                <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-neutral-700/50 z-10 min-w-[100px]">
                                                    {playbackRates.map(rate => (
                                                        <button
                                                            key={rate}
                                                            className={`block w-full text-left px-3 py-2 rounded-md text-sm hover:bg-neutral-700/50 transition-colors ${playbackRate === rate ? 'text-purple-400' : 'text-neutral-300'}`}
                                                            onClick={() => changePlaybackRate(rate)}
                                                        >
                                                            {rate}x
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Quality Settings */}
                                        <div className="relative">
                                            <button 
                                                className="text-white hover:text-purple-300 transition-colors text-sm font-medium"
                                                onClick={() => {setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false);}}
                                            >
                                                {videoQuality}
                                            </button>
                                            
                                            {showQualityMenu && (
                                                <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-neutral-700/50 z-10 min-w-[100px]">
                                                    {videoQualities.map(quality => (
                                                        <button
                                                            key={quality}
                                                            className={`block w-full text-left px-3 py-2 rounded-md text-sm hover:bg-neutral-700/50 transition-colors ${videoQuality === quality ? 'text-purple-400' : 'text-neutral-300'}`}
                                                            onClick={() => changeVideoQuality(quality)}
                                                        >
                                                            {quality}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Theater Mode */}
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={() => setShowTheaterMode(!showTheaterMode)}
                                            title="Theater mode (T)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </button>
                                        
                                        {/* Fullscreen Button */}
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={toggleFullScreen}
                                        >
                                            {isFullScreen ? (
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

                            {/* Download Progress Overlay */}
                            {isDownloading && (
                                <div className="absolute top-4 right-4 bg-neutral-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                                    <div className="w-32 h-2 bg-neutral-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-neutral-300 mt-1">Downloading... {downloadProgress}%</p>
                                </div>
                            )}
                        </div>

                        {!showTheaterMode && (
                            <div className="mt-6 bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h1 className="text-2xl font-bold text-white mb-2">{lesson.heading}</h1>
                                        <p className="text-neutral-300">{lesson.description}</p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                        <button 
                                            onClick={handleLike}
                                            className={`flex items-center space-x-1 px-4 py-2 rounded-full transition-all duration-300 ${isLiked ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white' : 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700/70'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            <span>{likeCount}</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => setShowShareModal(true)}
                                            className="flex items-center space-x-1 px-4 py-2 rounded-full bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700/70 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                            <span>Share</span>
                                        </button>
                                        
                                        <button 
                                            onClick={downloadLesson}
                                            className="flex items-center space-x-1 px-4 py-2 rounded-full bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700/70 transition-colors"
                                            disabled={isDownloading}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Download</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => setShowNotes(!showNotes)}
                                            className="flex items-center space-x-1 px-4 py-2 rounded-full bg-neutral-700/50 text-neutral-300 hover:bg-neutral-700/70 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>Notes</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center overflow-hidden">
                                            {lesson.author?.profilePicture ? (
                                                <img 
                                                    src={lesson.author.profilePicture} 
                                                    alt={lesson.author.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-white font-medium">
                                                    {lesson.author?.name?.charAt(0) || 'U'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{lesson.author?.name || 'Unknown Author'}</p>
                                            <p className="text-sm text-neutral-400">
                                                {new Date(lesson.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 text-sm text-neutral-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        <span>{lesson.views || 0} views</span>
                                    </div>
                                </div>
                                
                                {/* Notes Section */}
                                {showNotes && (
                                    <div className="mb-6 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium text-white">Your Notes</h3>
                                            <div className="flex items-center space-x-2">
                                                <button 
                                                    onClick={addTimestamp}
                                                    className="text-xs px-2 py-1 bg-neutral-700/50 rounded-md hover:bg-neutral-700/70 transition-colors"
                                                >
                                                    Add Timestamp
                                                </button>
                                                <button 
                                                    onClick={saveUserNotes}
                                                    className="text-xs px-2 py-1 bg-gradient-to-r from-purple-600 to-amber-500 rounded-md hover:from-purple-500 hover:to-amber-400 transition-all"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <textarea
                                            ref={notesRef}
                                            value={userNotes}
                                            onChange={(e) => setUserNotes(e.target.value)}
                                            placeholder="Add your notes here..."
                                            className="w-full h-32 p-3 bg-neutral-900/50 border border-neutral-700/30 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                        />
                                        
                                        {savedTimestamps.length > 0 && (
                                            <div className="mt-3">
                                                <h4 className="text-sm font-medium text-neutral-300 mb-2">Timestamps</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {savedTimestamps.map((ts, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => jumpToTimestamp(ts.time)}
                                                            className="text-xs px-2 py-1 bg-neutral-700/50 rounded-md hover:bg-neutral-700/70 transition-colors"
                                                        >
                                                            {formatTime(ts.time)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* Comments Section */}
                                <div className="border-t border-neutral-700/30 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-white">Comments ({comments.length})</h3>
                                        <button 
                                            onClick={() => setShowComments(!showComments)}
                                            className="text-sm text-neutral-400 hover:text-white transition-colors"
                                        >
                                            {showComments ? 'Hide' : 'Show'} Comments
                                        </button>
                                    </div>
                                    
                                    {showComments && (
                                        <>
                                            <form onSubmit={handleCommentSubmit} className="mb-6">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                        {ProfileData?.profilePicture ? (
                                                            <img 
                                                                src={ProfileData.profilePicture} 
                                                                alt={ProfileData.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-white text-sm font-medium">
                                                                {ProfileData?.name?.charAt(0) || 'U'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 relative">
                                                        <input
                                                            ref={commentInputRef}
                                                            type="text"
                                                            value={comment}
                                                            onChange={(e) => setComment(e.target.value)}
                                                            placeholder="Add a comment..."
                                                            className="w-full bg-neutral-900/50 border border-neutral-700/30 rounded-full px-4 py-2 pr-10 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                                        />
                                                        <button 
                                                            type="submit"
                                                            disabled={!comment.trim()}
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                            
                                            <div className="space-y-4">
                                                {comments.length > 0 ? (
                                                    comments.map((comment, index) => (
                                                        <div key={index} className="flex items-start space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                                <span className="text-white text-sm font-medium">
                                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <p className="text-sm font-medium text-white">{comment.user?.name || 'Unknown User'}</p>
                                                                    <span className="text-xs text-neutral-500">
                                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-neutral-300">{comment.text}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-neutral-500 py-4">No comments yet. Be the first to comment!</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Sidebar - Related Lessons */}
                    {!showTheaterMode && (
                        <div className="lg:w-80 space-y-6">
                            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-5 border border-neutral-700/30">
                                <h3 className="text-lg font-medium text-white mb-4">Related Lessons</h3>
                                
                                {isLoadingRelated ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse flex space-x-3">
                                                <div className="flex-none w-20 h-16 bg-neutral-700/50 rounded-lg"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-neutral-700/50 rounded"></div>
                                                    <div className="h-3 bg-neutral-700/50 rounded w-3/4"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : relatedLessons.length > 0 ? (
                                    <div className="space-y-4">
                                        {relatedLessons.map(relatedLesson => (
                                            <div 
                                                key={relatedLesson._id} 
                                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-700/30 cursor-pointer transition-colors"
                                                onClick={() => navigateToLesson(relatedLesson._id)}
                                            >
                                                <div className="flex-none w-20 h-16 bg-gradient-to-br from-purple-600 to-amber-500 rounded-lg overflow-hidden">
                                                    {relatedLesson.thumbnail ? (
                                                        <img 
                                                            src={relatedLesson.thumbnail} 
                                                            alt={relatedLesson.heading}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-white truncate">{relatedLesson.heading}</h4>
                                                    <p className="text-xs text-neutral-400 truncate">{relatedLesson.author?.name || 'Unknown Author'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-neutral-500 text-center py-4">No related lessons found</p>
                                )}
                            </div>
                            
                            {/* Lesson Details Card */}
                            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-5 border border-neutral-700/30">
                                <h3 className="text-lg font-medium text-white mb-4">Lesson Details</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">Duration</span>
                                        <span className="text-white">{formatTime(duration)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">Format</span>
                                        <span className="text-white">{lesson.files?.url ? lesson.files.url.split('.').pop().toUpperCase() : 'N/A'}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">Uploaded</span>
                                        <span className="text-white">{new Date(lesson.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                        <span className="text-neutral-400">Level</span>
                                        <span className="text-white capitalize">{lesson.level || 'All Levels'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-800/95 backdrop-blur-md rounded-2xl p-6 max-w-md w-full border border-neutral-700/50 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xl font-bold text-white">Share Lesson</h3>
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="text-neutral-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="mb-5">
                            <h4 className="text-sm font-medium text-neutral-300 mb-2">Share with peers</h4>
                            
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {peersList.length > 0 ? (
                                    peersList.map(peer => (
                                        <div 
                                            key={peer._id} 
                                            className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center overflow-hidden">
                                                    {peer.profilePicture ? (
                                                        <img 
                                                            src={peer.profilePicture} 
                                                            alt={peer.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-white font-medium">
                                                            {peer.name?.charAt(0) || 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{peer.name}</p>
                                                    <p className="text-xs text-neutral-400">{peer.email}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => shareLessonWithPeer(peer._id)}
                                                className="px-3 py-1 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full text-sm hover:from-purple-500 hover:to-amber-400 transition-all"
                                            >
                                                Share
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-neutral-500 py-4">No peers found</p>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-medium text-neutral-300 mb-2">Or copy link</h4>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={`${window.location.origin}/video?l=${lesson._id}`}
                                    className="flex-1 bg-neutral-900/50 border border-neutral-700/30 rounded-lg px-3 py-2 text-white text-sm"
                                />
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/video?l=${lesson._id}`);
                                    }}
                                    className="px-3 py-2 bg-neutral-700/50 rounded-lg text-sm hover:bg-neutral-700/70 transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Video;