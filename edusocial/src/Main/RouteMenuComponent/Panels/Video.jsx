import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLessonStore } from '../../../StateManagement/StoreNotes';
import { UserDataContextExport } from '../CurrentUserContexProvider';
import Socket from '../../../SocketConnection/Socket';
import Lenis from "@studio-freight/lenis";
import axios from 'axios';
import LikeComponent from '../SmallComponents/LikeComponent';

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
    
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [isVideoWaiting, setIsVideoWaiting] = useState(false);
    const [bufferedProgress, setBufferedProgress] = useState(0);
    const [videoError, setVideoError] = useState(null);
    
    const videoRef = useRef(null);
    const controlsTimeout = useRef(null);
    const containerRef = useRef(null);
    const commentInputRef = useRef(null);
    const notesRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const lessonId = searchParams.get('l');

    const loadLesson = useCallback(async (id) => {
        if (!id) return;
        
        setIsLoadingLesson(true);
        setVideoError(null);
        try {
            let lessonData = getLessonById(id);
            
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
                
                loadUserNotes(lessonData._id);
                
                if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    setIsPlaying(false);
                }
            } else {
                console.error('Lesson not found');
                setVideoError('Lesson not found');
            }
        } catch (err) {
            console.error('Error loading lesson:', err);
            setVideoError('Error loading lesson');
        } finally {
            setIsLoadingLesson(false);
        }
    }, [getLessonById, fetchLesson, ProfileData]);

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

    const addTimestamp = () => {
        if (!videoRef.current) return;
        
        const timestamp = videoRef.current.currentTime;
        const note = `[${formatTime(timestamp)}] `;
        
        setUserNotes(prev => prev + note);
        setSavedTimestamps(prev => [...prev, { time: timestamp, note: '' }]);
        
        setTimeout(saveUserNotes, 1000);
    };

    const jumpToTimestamp = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setIsPlaying(true);
            videoRef.current.play();
        }
    };

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

    useEffect(() => {
        if (lessonId) {
            loadLesson(lessonId);
        }
    }, [lessonId, loadLesson]);

    useEffect(() => {
        const handleUrlChange = () => {
            const newLessonId = new URLSearchParams(window.location.search).get('l');
            if (newLessonId && newLessonId !== lessonId) {
                loadLesson(newLessonId);
            }
        };

        window.addEventListener('popstate', handleUrlChange);
        
        return () => {
            window.removeEventListener('popstate', handleUrlChange);
        };
    }, [lessonId, loadLesson]);

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

    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            
            const handleLoadStart = () => {
                setIsVideoLoading(true);
                setVideoError(null);
            };
            
            const handleCanPlay = () => {
                setIsVideoLoading(false);
                setIsVideoWaiting(false);
            };
            
            const handleCanPlayThrough = () => {
                setIsVideoLoading(false);
                setIsVideoWaiting(false);
            };
            
            const handleWaiting = () => {
                setIsVideoWaiting(true);
            };
            
            const handlePlaying = () => {
                setIsVideoWaiting(false);
                setIsPlaying(true);
            };
            
            const handleError = (e) => {
                setIsVideoLoading(false);
                setIsVideoWaiting(false);
                console.error('Video error:', e);
                setVideoError('Failed to load video. Please check your connection.');
            };
            
            const handleTimeUpdate = () => {
                setCurrentTime(video.currentTime);
                
                if (video.buffered.length > 0) {
                    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                    const duration = video.duration;
                    if (duration > 0) {
                        setBufferedProgress((bufferedEnd / duration) * 100);
                    }
                }
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
            
            const handleProgress = () => {
                if (video.buffered.length > 0) {
                    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                    const duration = video.duration;
                    if (duration > 0) {
                        setBufferedProgress((bufferedEnd / duration) * 100);
                    }
                }
            };
            
            video.addEventListener('loadstart', handleLoadStart);
            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('canplaythrough', handleCanPlayThrough);
            video.addEventListener('waiting', handleWaiting);
            video.addEventListener('playing', handlePlaying);
            video.addEventListener('error', handleError);
            video.addEventListener('timeupdate', handleTimeUpdate);
            video.addEventListener('loadedmetadata', handleLoadedMetadata);
            video.addEventListener('play', handlePlay);
            video.addEventListener('pause', handlePause);
            video.addEventListener('ended', handleEnded);
            video.addEventListener('progress', handleProgress);
            
            return () => {
                video.removeEventListener('loadstart', handleLoadStart);
                video.removeEventListener('canplay', handleCanPlay);
                video.removeEventListener('canplaythrough', handleCanPlayThrough);
                video.removeEventListener('waiting', handleWaiting);
                video.removeEventListener('playing', handlePlaying);
                video.removeEventListener('error', handleError);
                video.removeEventListener('timeupdate', handleTimeUpdate);
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
                video.removeEventListener('ended', handleEnded);
                video.removeEventListener('progress', handleProgress);
            };
        }
    }, [lesson]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

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

    const fetchRelatedLessons = async (authorId, currentLessonId) => {
        if (!authorId) return;
        
        setIsLoadingRelated(true);
        try {
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

    const togglePlayPause = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(error => {
                    console.error('Play failed:', error);
                    setVideoError('Failed to play video');
                });
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
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
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
        setSearchParams({ l: newLessonId });
        
        window.scrollTo(0, 0);
    };

    const retryVideoLoad = () => {
        setVideoError(null);
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.play().catch(console.error);
        }
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
                                <>
                                    <video
                                        ref={videoRef}
                                        src={lesson.files.url}
                                        className="w-full h-full aspect-video object-contain"
                                        poster={lesson.thumbnail}
                                        onClick={togglePlayPause}
                                        preload="auto"
                                        autoPlay
                                    />
                                    
                                    {(isVideoLoading || isVideoWaiting) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                            <div className="flex flex-col items-center">
                                                <div className="relative">
                                                    <div className="w-16 h-16 border-4 border-neutral-600/30 rounded-full"></div>
                                                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent  border-t-red-600 rounded-full animate-spin"></div>
                                                </div>
                                                <p className="text-white mt-3 text-sm font-medium">
                                                    {isVideoLoading ? 'Loading video...' : 'Buffering...'}
                                                </p>
                                                {isVideoWaiting && (
                                                    <p className="text-neutral-400 text-xs mt-1">
                                                        {bufferedProgress.toFixed(0)}% loaded
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {videoError && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                                            <div className="text-center p-6 max-w-md">
                                                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2">Video Error</h3>
                                                <p className="text-neutral-300 mb-4">{videoError}</p>
                                                <button 
                                                    onClick={retryVideoLoad}
                                                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 font-medium"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full aspect-video bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                            )}

                            <div 
                                className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div 
                                    className="w-full h-2 bg-neutral-600/20 cursor-pointer absolute top-0 left-0"
                                    onClick={handleProgressClick}
                                >
                                    <div 
                                        className="h-full bg-neutral-500/30 transition-all"
                                        style={{ width: `${bufferedProgress}%` }}
                                    ></div>
                                </div>
                                
                                <div 
                                    className="w-full h-2 bg-neutral-600/50 cursor-pointer group-hover:h-3 transition-all relative"
                                    onClick={handleProgressClick}
                                >
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-200 relative z-10"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    ></div>
                                </div>
                                
                                <div className="flex items-center justify-between p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center space-x-4">
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={togglePlayPause}
                                            disabled={isVideoLoading || !!videoError}
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
                                        <button 
                                            className="text-white hover:text-amber-300 transition-colors"
                                            onClick={addTimestamp}
                                            title="Add timestamp (N)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        
                                        <div className="relative">
                                            <button 
                                                className="text-white hover:text-purple-300 transition-colors text-sm font-medium"
                                                onClick={() => {setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false);}}
                                            >
                                                {playbackRate}x
                                            </button>
                                            {showSpeedMenu && (
                                                <div className="absolute bottom-full mb-2 right-0 bg-neutral-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-neutral-700/50 py-2 min-w-[120px] z-50">
                                                    {playbackRates.map(rate => (
                                                        <button
                                                            key={rate}
                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-700/50 transition-colors ${rate === playbackRate ? 'text-purple-400 font-medium' : 'text-neutral-300'}`}
                                                            onClick={() => changePlaybackRate(rate)}
                                                        >
                                                            {rate}x
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="relative">
                                            <button 
                                                className="text-white hover:text-purple-300 transition-colors text-sm font-medium"
                                                onClick={() => {setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false);}}
                                            >
                                                {videoQuality}
                                            </button>
                                            {showQualityMenu && (
                                                <div className="absolute bottom-full mb-2 right-0 bg-neutral-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-neutral-700/50 py-2 min-w-[100px] z-50">
                                                    {videoQualities.map(quality => (
                                                        <button
                                                            key={quality}
                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-700/50 transition-colors ${quality === videoQuality ? 'text-purple-400 font-medium' : 'text-neutral-300'}`}
                                                            onClick={() => changeVideoQuality(quality)}
                                                        >
                                                            {quality}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={() => setShowTheaterMode(!showTheaterMode)}
                                            title="Theater mode (T)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                                            </svg>
                                        </button>
                                        
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={toggleFullScreen}
                                            title="Fullscreen (F)"
                                        >
                                            {isFullScreen ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`mt-6 ${showTheaterMode ? 'px-4' : ''}`}>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
                                {lesson.heading}
                            </h1>
                            
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-sm">
                                                {lesson.author?.username?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{lesson.author?.username || 'Unknown'}</p>
                                            <p className="text-sm text-neutral-400">Published {new Date(lesson.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <LikeComponent 
                                        isLiked={isLiked}
                                        likeCount={likeCount}
                                        onLike={handleLike}
                                        disabled={!ProfileData?._id}
                                    />
                                    
                                    <button 
                                        className="flex items-center space-x-2 px-4 py-2 bg-neutral-800/70 hover:bg-neutral-700/70 rounded-full transition-colors"
                                        onClick={() => setShowShareModal(true)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        <span>Share</span>
                                    </button>
                                    
                                    <button 
                                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 rounded-full transition-all duration-300 transform hover:-translate-y-0.5"
                                        onClick={downloadLesson}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>{downloadProgress}%</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                <span>Download</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-neutral-800/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-neutral-700/30">
                                <p className="text-neutral-200 leading-relaxed">
                                    {lesson.description || 'No description available.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!showTheaterMode && (
                        <div className="lg:w-80 flex-shrink-0">
                            <div className="bg-neutral-800/30 backdrop-blur-sm rounded-xl p-4 mb-6 border border-neutral-700/30">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-white">My Notes</h3>
                                    <button 
                                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                        onClick={() => setShowNotes(!showNotes)}
                                    >
                                        {showNotes ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                
                                {showNotes && (
                                    <div className="space-y-3">
                                        <textarea
                                            ref={notesRef}
                                            value={userNotes}
                                            onChange={(e) => setUserNotes(e.target.value)}
                                            onBlur={saveUserNotes}
                                            placeholder="Add your notes here... (Press N to add timestamp)"
                                            className="w-full h-24 bg-neutral-700/50 border border-neutral-600/50 rounded-lg p-3 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                        />
                                        
                                        {savedTimestamps.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-neutral-400 font-medium">Timestamps:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {savedTimestamps.map((ts, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => jumpToTimestamp(ts.time)}
                                                            className="text-xs bg-neutral-700/50 hover:bg-neutral-600/50 px-2 py-1 rounded transition-colors"
                                                        >
                                                            {formatTime(ts.time)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-neutral-800/30 backdrop-blur-sm rounded-xl p-4 border border-neutral-700/30">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-white">Comments ({comments.length})</h3>
                                    <button 
                                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                        onClick={() => setShowComments(!showComments)}
                                    >
                                        {showComments ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                
                                {showComments && (
                                    <>
                                        {ProfileData?._id && (
                                            <form onSubmit={handleCommentSubmit} className="mb-4">
                                                <div className="flex space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">
                                                                {ProfileData.username?.charAt(0)?.toUpperCase() || 'U'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            ref={commentInputRef}
                                                            type="text"
                                                            value={comment}
                                                            onChange={(e) => setComment(e.target.value)}
                                                            placeholder="Add a comment..."
                                                            className="w-full bg-neutral-700/50 border border-neutral-600/50 rounded-full px-4 py-2 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-purple-500 transition-colors"
                                                        />
                                                    </div>
                                                    <button 
                                                        type="submit"
                                                        disabled={!comment.trim()}
                                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 disabled:from-neutral-600 disabled:to-neutral-600 disabled:cursor-not-allowed rounded-full transition-all duration-300 text-sm font-medium"
                                                    >
                                                        Post
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                        
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {comments.length > 0 ? (
                                                comments.map((comment, index) => (
                                                    <div key={index} className="flex space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
                                                                <span className="text-neutral-300 text-xs">
                                                                    {comment.user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-white">
                                                                {comment.user?.username || 'Unknown'}
                                                            </p>
                                                            <p className="text-sm text-neutral-300 mt-1">
                                                                {comment.text}
                                                            </p>
                                                            <p className="text-xs text-neutral-500 mt-1">
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-neutral-400 text-sm text-center py-4">
                                                    No comments yet. Be the first to comment!
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="mt-6">
                                <h3 className="font-semibold text-white mb-4">Related Lessons</h3>
                                {isLoadingRelated ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse flex space-x-3">
                                                <div className="w-20 h-12 bg-neutral-700 rounded"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-neutral-700 rounded"></div>
                                                    <div className="h-2 bg-neutral-700 rounded w-3/4"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : relatedLessons.length > 0 ? (
                                    <div className="space-y-3">
                                        {relatedLessons.map(relatedLesson => (
                                            <button
                                                key={relatedLesson._id}
                                                onClick={() => navigateToLesson(relatedLesson._id)}
                                                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-700/50 transition-colors text-left"
                                            >
                                                <div className="w-20 h-12 bg-gradient-to-br from-purple-600 to-amber-500 rounded flex items-center justify-center flex-shrink-0">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {relatedLesson.heading}
                                                    </p>
                                                    <p className="text-xs text-neutral-400 truncate">
                                                        {relatedLesson.author?.username}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-neutral-400 text-sm">No related lessons found.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-800/95 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Share Lesson</h3>
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="text-neutral-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 p-3 bg-neutral-700/50 rounded-lg">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-amber-500 rounded flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{lesson.heading}</p>
                                    <p className="text-neutral-400 text-sm truncate">{lesson.author?.username}</p>
                                </div>
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto">
                                <p className="text-sm text-neutral-400 mb-2">Share with:</p>
                                {peersList.length > 0 ? (
                                    <div className="space-y-2">
                                        {peersList.map(peer => (
                                            <button
                                                key={peer._id}
                                                onClick={() => shareLessonWithPeer(peer._id)}
                                                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-700/50 transition-colors"
                                            >
                                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                        {peer.username?.charAt(0)?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-medium text-white">{peer.username}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-neutral-400 text-sm text-center py-4">
                                        No connections found. Add friends to share lessons.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Video;