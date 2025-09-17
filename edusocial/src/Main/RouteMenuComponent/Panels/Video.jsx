import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate , useSearchParams} from 'react-router-dom';
import { useLessonStore } from '../../../StateManagement/StoreNotes';
import { UserDataContextExport } from '../CurrentUserContexProvider';
import Socket from '../../../SocketConnection/Socket';
import Lenis from "@studio-freight/lenis";

const Video = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getLessonById, loading, error, addCommentToLesson, updateLessonLikes, fetchLesson } = useLessonStore();
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
    const videoRef = useRef(null);
    const controlsTimeout = useRef(null);
    const containerRef = useRef(null);
    const commentInputRef = useRef(null);
    const [searchParams] = useSearchParams();
    const lessonId = searchParams.get('l');


    const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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
      if (lessonId) {
          // Change from getLesson(lessonId) to getLessonById(lessonId)
          const lessonData = getLessonById(lessonId);
          if (lessonData) {
              setLesson(lessonData);
              setComments(lessonData.comments || []);
              setLikeCount(lessonData.likes?.length || 0);
              setIsLiked(lessonData.likes?.includes(ProfileData?._id) || false);
              fetchRelatedLessons(lessonData.author?._id, lessonData._id);
          }
      }
  }, [id, getLessonById, ProfileData]);

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
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);

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
            // This would typically be an API call to fetch related lessons
            // For now, we'll simulate with a timeout
            setTimeout(() => {
                const lessons = useLessonStore.getState().Lessons;
                const related = lessons
                    .filter(l => l.author?._id === authorId && l._id !== currentLessonId)
                    .slice(0, 3);
                setRelatedLessons(related);
                setIsLoadingRelated(false);
            }, 1000);
        } catch (error) {
            console.error('Error fetching related lessons:', error);
            setIsLoadingRelated(false);
        }
    };

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

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

  const handleLike = async () => {
      if (!ProfileData?._id) return;
      
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
          
          // Change from likeLesson to updateLessonLikes
          updateLessonLikes(lesson._id, newLikeStatus ? [...lesson.likes, ProfileData._id] : lesson.likes.filter(id => id !== ProfileData._id));
      } catch (error) {
          console.error('Error liking lesson:', error);
          setIsLiked(!newLikeStatus);
          setLikeCount(prev => newLikeStatus ? prev - 1 : prev + 1);
      }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !ProfileData?._id) return;
    
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
        
        // Change from addComment to addCommentToLesson
        addCommentToLesson(lesson._id, newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
    }
};

    const navigateToLesson = (lessonId) => {
        navigate(`/video/${lessonId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/30 font-medium"
                    >
                        Back to Lessons
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="lenis min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
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
                    
                    <div className="w-6"></div> {/* Spacer for balance */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Video Content */}
                    <div className="flex-1">
                        <div 
                            ref={containerRef}
                            className="relative bg-black rounded-2xl overflow-hidden shadow-xl border border-neutral-700/30 group"
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
                                <div className="w-full aspect-video bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
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
                                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-200"
                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                    ></div>
                                </div>
                                
                                {/* Control Bar */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <div className="flex items-center space-x-4">
                                        <button 
                                            className="text-white hover:text-blue-300 transition-colors"
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
                                                className="text-white cursor-pointer hover:text-blue-300 transition-colors"
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
                                                className="w-16 h-1 accent-blue-500 cursor-pointer"
                                            />
                                        </div>
                                        
                                        <span className="text-sm text-neutral-300">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                        {/* Playback Speed */}
                                        <div className="relative">
                                            <button 
                                                className="text-white hover:text-blue-300 transition-colors text-sm font-medium"
                                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                            >
                                                {playbackRate}x
                                            </button>
                                            
                                            {showSpeedMenu && (
                                                <div className="absolute bottom-full right-0 mb-2 bg-neutral-800/95 backdrop-blur-sm rounded-lg p-2 shadow-xl border border-neutral-700/50 z-10">
                                                    {playbackRates.map(rate => (
                                                        <button
                                                            key={rate}
                                                            className={`block w-full text-left px-3 py-2 rounded-md text-sm hover:bg-neutral-700/50 transition-colors ${playbackRate === rate ? 'text-blue-400' : 'text-neutral-300'}`}
                                                            onClick={() => changePlaybackRate(rate)}
                                                        >
                                                            {rate}x
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Fullscreen Button */}
                                        <button 
                                            className="text-white hover:text-blue-300 transition-colors"
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
                        </div>

                        {/* Video Info Section */}
                        <div className="mt-6 bg-neutral-800/40 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30">
                            <h1 className="text-2xl font-bold text-white mb-3">
                                {lesson.heading || 'Untitled Lesson'}
                            </h1>
                            
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-amber-500">
                                        <img 
                                            src={lesson.author?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                            alt={lesson.author?.firstName || 'User'} 
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            {lesson.author?.firstName} {lesson.author?.lastName}
                                        </p>
                                        <p className="text-sm text-neutral-400">
                                            {lesson.author?.username}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    <button
                                        className={`flex items-center space-x-1 transition-all duration-300 ${isLiked ? 'text-red-500' : 'text-neutral-400 hover:text-red-400'}`}
                                        onClick={handleLike}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isLiked ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        <span className="font-medium">{likeCount}</span>
                                    </button>
                                    
                                    <button 
                                        className="text-neutral-400 hover:text-blue-400 transition-colors flex items-center space-x-1"
                                        onClick={() => {
                                            setShowComments(!showComments);
                                            setTimeout(() => {
                                                if (showComments && commentInputRef.current) {
                                                    commentInputRef.current.focus();
                                                }
                                            }, 100);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <span className="font-medium">{comments.length}</span>
                                    </button>
                                    
                                    <button className="text-neutral-400 hover:text-green-400 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <p className="text-neutral-300 leading-relaxed">
                                {lesson.description || 'No description provided.'}
                            </p>
                            
                            <div className="mt-4 pt-4 border-t border-neutral-700/50">
                                <p className="text-sm text-neutral-500">
                                    Uploaded on {new Date(lesson.createdAt).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Comments Section */}
                        {showComments && (
                            <div className="mt-6 bg-neutral-800/40 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30">
                                <h2 className="text-xl font-semibold text-white mb-4">Comments ({comments.length})</h2>
                                
                                {/* Comment Form */}
                                {ProfileData?._id && (
                                    <form onSubmit={handleCommentSubmit} className="mb-6">
                                        <div className="flex items-start space-x-3">
                                            <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-amber-500 flex-shrink-0">
                                                <img 
                                                    src={ProfileData?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                                    alt="Your avatar" 
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    ref={commentInputRef}
                                                    type="text"
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="Add a comment..."
                                                    className="w-full bg-neutral-700/50 border border-neutral-600/50 rounded-xl px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!comment.trim()}
                                                className={`px-4 py-3 rounded-xl font-medium transition-all ${comment.trim() ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white' : 'bg-neutral-700/30 text-neutral-500 cursor-not-allowed'}`}
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </form>
                                )}
                                
                                {/* Comments List */}
                                <div className="space-y-4">
                                    {comments.length === 0 ? (
                                        <div className="text-center py-8 text-neutral-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <p>No comments yet. Be the first to comment!</p>
                                        </div>
                                    ) : (
                                        comments.map((comment, index) => (
                                            <div key={index} className="flex items-start space-x-3">
                                                <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-r from-purple-600 to-amber-500 flex-shrink-0">
                                                    <img 
                                                        src={comment.user?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                                        alt={comment.user?.firstName || 'User'} 
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="bg-neutral-700/30 rounded-2xl p-3">
                                                        <p className="font-medium text-white">
                                                            {comment.user?.firstName} {comment.user?.lastName}
                                                        </p>
                                                        <p className="text-neutral-300 mt-1">{comment.text}</p>
                                                    </div>
                                                    <p className="text-xs text-neutral-500 mt-1">
                                                        {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Related Lessons */}
                    <div className="lg:w-80 flex-shrink-0">
                        <div className="sticky top-24">
                            <h2 className="text-xl font-semibold text-white mb-4">More from {lesson.author?.firstName}</h2>
                            
                            {isLoadingRelated ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-neutral-800/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-neutral-700/30 animate-pulse">
                                            <div className="w-full aspect-video bg-gradient-to-r from-neutral-700/50 to-neutral-600/50"></div>
                                            <div className="p-3">
                                                <div className="h-4 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-full w-3/4 mb-2"></div>
                                                <div className="h-3 bg-gradient-to-r from-neutral-700/50 to-neutral-600/50 rounded-full w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : relatedLessons.length > 0 ? (
                                <div className="space-y-4">
                                    {relatedLessons.map(relatedLesson => (
                                        <div 
                                            key={relatedLesson._id}
                                            className="bg-neutral-800/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-neutral-700/30 transition-all hover:border-neutral-600/50 hover:shadow-lg cursor-pointer"
                                            onClick={() => navigateToLesson(relatedLesson._id)}
                                        >
                                            {relatedLesson.files?.url && relatedLesson.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                                                <img
                                                    src={relatedLesson.files.url}
                                                    alt={relatedLesson.heading || 'Study lesson'}
                                                    className="w-full aspect-video object-cover"
                                                    loading="lazy"
                                                />
                                            ) : relatedLesson.files?.url && relatedLesson.files.url.match(/\.(mp4|webm|ogg)$/) ? (
                                                <div className="relative w-full aspect-video">
                                                    <video
                                                        src={relatedLesson.files.url}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                        playsInline
                                                        poster={relatedLesson.thumbnail}
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-video bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                            )}
                                            
                                            <div className="p-3">
                                                <h3 className="font-medium text-white truncate">
                                                    {relatedLesson.heading || 'Untitled Lesson'}
                                                </h3>
                                                <p className="text-sm text-neutral-400 mt-1">
                                                    {relatedLesson.author?.firstName} {relatedLesson.author?.lastName}
                                                </p>
                                                <p className="text-xs text-neutral-500 mt-1">
                                                    {new Date(relatedLesson.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-neutral-500 bg-neutral-800/40 backdrop-blur-sm rounded-2xl border border-neutral-700/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <p>No other lessons from this creator yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Video;