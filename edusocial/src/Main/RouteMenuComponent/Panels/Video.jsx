// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
// import { useLessonStore } from '../../../StateManagement/StoreNotes';
// import { UserDataContextExport } from '../CurrentUserContexProvider';
// import Socket from '../../../SocketConnection/Socket';
// import Lenis from "@studio-freight/lenis";
// import axios from 'axios';
// import LikeComponent from '../SmallComponents/LikeComponent';

// const Video = () => {
//     const { id } = useParams();
//     const navigate = useNavigate();
//     const { getLessonById, loading, error, addCommentToLesson, updateLessonLikes, fetchLesson, Lessons } = useLessonStore();
//     const { ProfileData } = UserDataContextExport();
//     const [lesson, setLesson] = useState(null);
//     const [comment, setComment] = useState('');
//     const [comments, setComments] = useState([]);
//     const [isLiked, setIsLiked] = useState(false);
//     const [likeCount, setLikeCount] = useState(0);
//     const [localLikedPosts, setLocalLikedPosts] = useState(new Set());
//     const [isPlaying, setIsPlaying] = useState(false);
//     const [currentTime, setCurrentTime] = useState(0);
//     const [duration, setDuration] = useState(0);
//     const [volume, setVolume] = useState(1);
//     const [isMuted, setIsMuted] = useState(false);
//     const [showControls, setShowControls] = useState(true);
//     const [isFullScreen, setIsFullScreen] = useState(false);
//     const [playbackRate, setPlaybackRate] = useState(1);
//     const [showSpeedMenu, setShowSpeedMenu] = useState(false);
//     const [showComments, setShowComments] = useState(true);
//     const [relatedLessons, setRelatedLessons] = useState([]);
//     const [isLoadingRelated, setIsLoadingRelated] = useState(false);
//     const [isLoadingLesson, setIsLoadingLesson] = useState(false);
//     const [showQualityMenu, setShowQualityMenu] = useState(false);
//     const [videoQuality, setVideoQuality] = useState('auto');
//     const [showNotes, setShowNotes] = useState(false);
//     const [userNotes, setUserNotes] = useState('');
//     const [savedTimestamps, setSavedTimestamps] = useState([]);
//     const [showShareModal, setShowShareModal] = useState(false);
//     const [downloadProgress, setDownloadProgress] = useState(0);
//     const [isDownloading, setIsDownloading] = useState(false);
//     const [peersList, setPeersList] = useState([]);
//     const [showTheaterMode, setShowTheaterMode] = useState(false);
//     const [playbackRates] = useState([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
//     const [videoQualities] = useState(['360p', '480p', '720p', '1080p', 'auto']);
    
//     const [isVideoLoading, setIsVideoLoading] = useState(false);
//     const [isVideoWaiting, setIsVideoWaiting] = useState(false);
//     const [bufferedProgress, setBufferedProgress] = useState(0);
//     const [videoError, setVideoError] = useState(null);
    
//     // New state for improved progress bar
//     const [isSeeking, setIsSeeking] = useState(false);
//     const [seekPreviewTime, setSeekPreviewTime] = useState(0);
//     const [seekPreviewVisible, setSeekPreviewVisible] = useState(false);
//     const [isMobile, setIsMobile] = useState(false);
    
//     const videoRef = useRef(null);
//     const controlsTimeout = useRef(null);
//     const containerRef = useRef(null);
//     const commentInputRef = useRef(null);
//     const notesRef = useRef(null);
//     const progressBarRef = useRef(null);
//     const [searchParams, setSearchParams] = useSearchParams();
//     const lessonId = searchParams.get('l');
//     const [Loading, setLoading] = useState(false);

//     // Detect mobile device
//     useEffect(() => {
//         const checkMobile = () => {
//             setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
//         };
//         checkMobile();
//         window.addEventListener('resize', checkMobile);
//         return () => window.removeEventListener('resize', checkMobile);
//     }, []);

//     const loadLesson = useCallback(async (id) => {
//         if (!id) return;
        
//         setIsLoadingLesson(true);
//         setVideoError(null);
//         try {
//             let lessonData = getLessonById(id);
            
//             if (!lessonData) {
//                 await fetchLesson(ProfileData?._id);
//                 lessonData = getLessonById(id);
//             }
            
//             if (lessonData) {
//                 setLesson(lessonData);
//                 setComments(lessonData.comments || []);
//                 setLocalLikedPosts(lessonData.likes?.length || 0);
//                 setIsLiked(lessonData.likes?.includes(ProfileData?._id) || false);
//                 fetchRelatedLessons(lessonData.author?._id, lessonData._id);
                
//                 loadUserNotes(lessonData._id);
                
//                 if (videoRef.current) {
//                     videoRef.current.currentTime = 0;
//                     setIsPlaying(false);
//                 }
//             } else {
//                 console.error('Lesson not found');
//                 setVideoError('Lesson not found');
//             }
//         } catch (err) {
//             console.error('Error loading lesson:', err);
//             setVideoError('Error loading lesson');
//         } finally {
//             setIsLoadingLesson(false);
//         }
//     }, [getLessonById, fetchLesson, ProfileData]);

//     const loadUserNotes = async (lessonId) => {
//         try {
//             const response = await axios.get(`${import.meta.env.VITE_API_URL}/lessons/notes/${lessonId}`, {
//                 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//             });
            
//             if (response.data.success) {
//                 setUserNotes(response.data.notes || '');
//                 setSavedTimestamps(response.data.timestamps || []);
//             }
//         } catch (error) {
//             console.log('No saved notes found or error loading notes');
//         }
//     };

//     const saveUserNotes = async () => {
//         try {
//             await axios.post(`${import.meta.env.VITE_API_URL}/lessons/notes`, {
//                 lessonId: lesson._id,
//                 notes: userNotes,
//                 timestamps: savedTimestamps
//             }, {
//                 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//             });
//         } catch (error) {
//             console.error('Error saving notes:', error);
//         }
//     };

//     const addTimestamp = () => {
//         if (!videoRef.current) return;
        
//         const timestamp = videoRef.current.currentTime;
//         const note = `[${formatTime(timestamp)}] `;
        
//         setUserNotes(prev => prev + note);
//         setSavedTimestamps(prev => [...prev, { time: timestamp, note: '' }]);
        
//         setTimeout(saveUserNotes, 1000);
//     };

//     const jumpToTimestamp = (time) => {
//         if (videoRef.current) {
//             videoRef.current.currentTime = time;
//             setIsPlaying(true);
//             videoRef.current.play();
//         }
//     };

//     const fetchPeersList = async () => {
//         const id = ProfileData?._id;
//         try {
//             const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/userConnections/${id}`);
//             if (res.data.ok) {
//                 setPeersList(res.data.Connections);
//             }
//         } catch (err) {
//             console.log(err.message);
//         }
//     };

//     const shareLessonWithPeer = async (peerId) => {
//         try {
//             const response = await axios.post(`${import.meta.env.VITE_API_URL}/lessons/share`, {
//                 lessonId: lesson._id,
//                 recipientId: peerId,
//                 senderId: ProfileData._id,
//             });

//             if (response.data.success) {
//                 Socket.emit("lesson-shared", {
//                     lessonData: lesson,
//                     recipientId: peerId,
//                     senderId: ProfileData._id,
//                 });
                
//                 setShowShareModal(false);
//             }
//         } catch (error) {
//             console.error("Error sharing lesson:", error);
//         }
//     };

//     const downloadLesson = async () => {
//         if (!lesson.files?.url) return;
        
//         setIsDownloading(true);
//         setDownloadProgress(0);
        
//         try {
//             const response = await axios.get(lesson.files.url, {
//                 responseType: 'blob',
//                 onDownloadProgress: (progressEvent) => {
//                     const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//                     setDownloadProgress(percent);
//                 }
//             });
            
//             const url = window.URL.createObjectURL(new Blob([response.data]));
//             const link = document.createElement('a');
//             link.href = url;
//             link.setAttribute('download', `${lesson.heading || 'lesson'}.${lesson.files.url.split('.').pop()}`);
//             document.body.appendChild(link);
//             link.click();
//             link.remove();
            
//         } catch (error) {
//             console.error('Download error:', error);
//         } finally {
//             setIsDownloading(false);
//         }
//     };

//     useEffect(() => {
//         if (lessonId) {
//             loadLesson(lessonId);
//         }
//     }, [lessonId, loadLesson]);

//     useEffect(() => {
//         const handleUrlChange = () => {
//             const newLessonId = new URLSearchParams(window.location.search).get('l');
//             if (newLessonId && newLessonId !== lessonId) {
//                 loadLesson(newLessonId);
//             }
//         };

//         window.addEventListener('popstate', handleUrlChange);
        
//         return () => {
//             window.removeEventListener('popstate', handleUrlChange);
//         };
//     }, [lessonId, loadLesson]);

//     useEffect(() => {
//         const lenis = new Lenis({
//             duration: 1.2,
//             smoothWheel: true,
//             smoothTouch: true,
//             touchMultiplier: 1.5,
//             wheelMultiplier: 1.2,
//             gestureOrientation: 'vertical',
//         });

//         function raf(time) {
//             lenis.raf(time);
//             requestAnimationFrame(raf);
//         }

//         requestAnimationFrame(raf);

//         return () => {
//             lenis.destroy();
//         };
//     }, []);


//     useEffect(() => {
//         const handleFullScreenChange = () => {
//             const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
//             setIsFullScreen(!!fullscreenElement);
            
//             // On mobile, lock orientation in landscape when in fullscreen
//             if (isMobile && fullscreenElement) {
//                 screen.orientation?.lock?.('landscape').catch(() => {});
//             } else if (isMobile && !fullscreenElement) {
//                 screen.orientation?.unlock?.();
//             }
//         };

//         document.addEventListener('fullscreenchange', handleFullScreenChange);
//         document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
//         document.addEventListener('msfullscreenchange', handleFullScreenChange);
        
//         return () => {
//             document.removeEventListener('fullscreenchange', handleFullScreenChange);
//             document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
//             document.removeEventListener('msfullscreenchange', handleFullScreenChange);
//         };
//     }, [isMobile]);

//     useEffect(() => {
//         if (videoRef.current) {
//             const video = videoRef.current;
            
//             const handleLoadStart = () => {
//                 setIsVideoLoading(true);
//                 setVideoError(null);
//             };
            
//             const handleCanPlay = () => {
//                 setIsVideoLoading(false);
//                 setIsVideoWaiting(false);
//             };
            
//             const handleCanPlayThrough = () => {
//                 setIsVideoLoading(false);
//                 setIsVideoWaiting(false);
//             };
            
//             const handleWaiting = () => {
//                 setIsVideoWaiting(true);
//             };
            
//             const handlePlaying = () => {
//                 setIsVideoWaiting(false);
//                 setIsPlaying(true);
//             };
            
//             const handleError = (e) => {
//                 setIsVideoLoading(false);
//                 setIsVideoWaiting(false);
//                 console.error('Video error:', e);
//                 setVideoError('Failed to load video. Please check your connection.');
//             };
            
//             const handleTimeUpdate = () => {
//                 if (!isSeeking) {
//                     setCurrentTime(video.currentTime);
//                 }
                
//                 if (video.buffered.length > 0) {
//                     const bufferedEnd = video.buffered.end(video.buffered.length - 1);
//                     const duration = video.duration;
//                     if (duration > 0) {
//                         setBufferedProgress((bufferedEnd / duration) * 100);
//                     }
//                 }
//             };
            
//             const handleLoadedMetadata = () => {
//                 setDuration(video.duration);
//             };
            
//             const handlePlay = () => {
//                 setIsPlaying(true);
//             };
            
//             const handlePause = () => {
//                 setIsPlaying(false);
//             };
            
//             const handleEnded = () => {
//                 setIsPlaying(false);
//                 setCurrentTime(0);
//             };
            
//             const handleProgress = () => {
//                 if (video.buffered.length > 0) {
//                     const bufferedEnd = video.buffered.end(video.buffered.length - 1);
//                     const duration = video.duration;
//                     if (duration > 0) {
//                         setBufferedProgress((bufferedEnd / duration) * 100);
//                     }
//                 }
//             };
            
//             video.addEventListener('loadstart', handleLoadStart);
//             video.addEventListener('canplay', handleCanPlay);
//             video.addEventListener('canplaythrough', handleCanPlayThrough);
//             video.addEventListener('waiting', handleWaiting);
//             video.addEventListener('playing', handlePlaying);
//             video.addEventListener('error', handleError);
//             video.addEventListener('timeupdate', handleTimeUpdate);
//             video.addEventListener('loadedmetadata', handleLoadedMetadata);
//             video.addEventListener('play', handlePlay);
//             video.addEventListener('pause', handlePause);
//             video.addEventListener('ended', handleEnded);
//             video.addEventListener('progress', handleProgress);
            
//             return () => {
//                 video.removeEventListener('loadstart', handleLoadStart);
//                 video.removeEventListener('canplay', handleCanPlay);
//                 video.removeEventListener('canplaythrough', handleCanPlayThrough);
//                 video.removeEventListener('waiting', handleWaiting);
//                 video.removeEventListener('playing', handlePlaying);
//                 video.removeEventListener('error', handleError);
//                 video.removeEventListener('timeupdate', handleTimeUpdate);
//                 video.removeEventListener('loadedmetadata', handleLoadedMetadata);
//                 video.removeEventListener('play', handlePlay);
//                 video.removeEventListener('pause', handlePause);
//                 video.removeEventListener('ended', handleEnded);
//                 video.removeEventListener('progress', handleProgress);
//             };
//         }
//     }, [lesson, isSeeking]);

//     useEffect(() => {
//         if (videoRef.current) {
//             videoRef.current.volume = volume;
//             videoRef.current.muted = isMuted;
//         }
//     }, [volume, isMuted]);

//     useEffect(() => {
//         const handleMouseMove = () => {
//             setShowControls(true);
            
//             if (controlsTimeout.current) {
//                 clearTimeout(controlsTimeout.current);
//             }
            
//             controlsTimeout.current = setTimeout(() => {
//                 if (isPlaying && !isSeeking) {
//                     setShowControls(false);
//                 }
//             }, 3000);
//         };
        
//         const container = containerRef.current;
//         if (container) {
//             container.addEventListener('mousemove', handleMouseMove);
//             container.addEventListener('touchstart', handleMouseMove);
            
//             return () => {
//                 container.removeEventListener('mousemove', handleMouseMove);
//                 container.removeEventListener('touchstart', handleMouseMove);
//                 if (controlsTimeout.current) {
//                     clearTimeout(controlsTimeout.current);
//                 }
//             };
//         }
//     }, [isPlaying, isSeeking]);

//     // Improved progress bar handlers
//     const handleProgressMouseDown = (e) => {
//         setIsSeeking(true);
//         setShowControls(true);
//         handleProgressMove(e);
//     };

//     const handleProgressTouchStart = (e) => {
//         setIsSeeking(true);
//         setShowControls(true);
//         handleProgressMove(e.touches[0]);
//     };

//     const handleProgressMove = (e) => {
//         if (!isSeeking || !progressBarRef.current) return;
        
//         const progressBar = progressBarRef.current;
//         const rect = progressBar.getBoundingClientRect();
//         const clickPosition = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
//         const progressBarWidth = progressBar.offsetWidth;
//         const newTime = (clickPosition / progressBarWidth) * duration;
        
//         setSeekPreviewTime(newTime);
//         setSeekPreviewVisible(true);
//     };

//     const handleProgressMouseUp = () => {
//         if (!isSeeking || !videoRef.current) return;
        
//         videoRef.current.currentTime = seekPreviewTime;
//         setCurrentTime(seekPreviewTime);
//         setIsSeeking(false);
//         setSeekPreviewVisible(false);
        
//         if (isPlaying) {
//             videoRef.current.play().catch(console.error);
//         }
//     };

    

//     const handleProgressMouseMove = (e) => {
//         if (isSeeking) {
//             handleProgressMove(e);
//         }
//     };

//     const handleProgressTouchMove = (e) => {
//         if (isSeeking && e.touches.length > 0) {
//             handleProgressMove(e.touches[0]);
//         }
//     };

//     const handleProgressTouchEnd = () => {
//         handleProgressMouseUp();
//     };

//     const fetchRelatedLessons = async (authorId, currentLessonId) => {
//         if (!authorId) return;
        
//         setIsLoadingRelated(true);
//         try {
//             const lessons = Lessons || [];
//             const related = lessons
//                 .filter(l => l.author?._id === authorId && l._id !== currentLessonId)
//                 .slice(0, 3);
//             setRelatedLessons(related);
//         } catch (error) {
//             console.error('Error fetching related lessons:', error);
//         } finally {
//             setIsLoadingRelated(false);
//         }
//     };

//     const togglePlayPause = () => {
//         if (videoRef.current) {
//             if (videoRef.current.paused) {
//                 videoRef.current.play().catch(error => {
//                     console.error('Play failed:', error);
//                     setVideoError('Failed to play video');
//                 });
//             } else {
//                 videoRef.current.pause();
//             }
//         }
//     };

//     const toggleFullScreen = () => {
//         if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
//             const container = containerRef.current;
//             if (container.requestFullscreen) {
//                 container.requestFullscreen();
//             } else if (container.webkitRequestFullscreen) {
//                 container.webkitRequestFullscreen();
//             } else if (container.msRequestFullscreen) {
//                 container.msRequestFullscreen();
//             } else if (container.webkitEnterFullscreen) { // iOS Safari
//                 container.webkitEnterFullscreen();
//             }
            
//             // On mobile, try to lock orientation to landscape
//             if (isMobile) {
//                 setTimeout(() => {
//                     screen.orientation?.lock?.('landscape').catch(() => {});
//                 }, 100);
//             }
//         } else {
//             if (document.exitFullscreen) {
//                 document.exitFullscreen();
//             } else if (document.webkitExitFullscreen) {
//                 document.webkitExitFullscreen();
//             } else if (document.msExitFullscreen) {
//                 document.msExitFullscreen();
//             }
            
//             // On mobile, unlock orientation
//             if (isMobile) {
//                 screen.orientation?.unlock?.();
//             }
//         }
//     };

//     const toggleMute = () => {
//         setIsMuted(!isMuted);
//     };

//     const seek = (seconds) => {
//         if (videoRef.current) {
//             videoRef.current.currentTime += seconds;
//         }
//     };

//     const adjustVolume = (delta) => {
//         setVolume(prev => Math.min(1, Math.max(0, prev + delta)));
//     };

//     const handleVolumeChange = (e) => {
//         const newVolume = parseFloat(e.target.value);
//         setVolume(newVolume);
//         setIsMuted(newVolume === 0);
//     };

//     const changePlaybackRate = (rate) => {
//         if (videoRef.current) {
//             videoRef.current.playbackRate = rate;
//             setPlaybackRate(rate);
//             setShowSpeedMenu(false);
//         }
//     };

//     const changeVideoQuality = (quality) => {
//         setVideoQuality(quality);
//         setShowQualityMenu(false);
//     };

//     const formatTime = (time) => {
//         if (isNaN(time)) return '0:00';
//         const minutes = Math.floor(time / 60);
//         const seconds = Math.floor(time % 60);
//         return `${minutes}:${seconds.toString().padStart(2, '0')}`;
//     };

//     // const handleLike = async () => {
//     //     if (!ProfileData?._id || !lesson) return;
        
//     //     try {
//     //         const newLikeStatus = !isLiked;
//     //         setIsLiked(newLikeStatus);
//     //         setLikeCount(prev => newLikeStatus ? prev + 1 : prev - 1);
            
//     //         Socket.emit("Handle-user-like", {
//     //             lessonId: lesson._id, 
//     //             userId: ProfileData._id, 
//     //             type: "like", 
//     //             toId: lesson.author?._id 
//     //         });
            
//     //         updateLessonLikes(lesson._id, newLikeStatus ? [...lesson.likes, ProfileData._id] : lesson.likes.filter(id => id !== ProfileData._id));
//     //     } catch (error) {
//     //         console.error('Error liking lesson:', error);
//     //         setIsLiked(!isLiked);
//     //         setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
//     //     }
//     // };

//      useEffect(() => {
//         const handler = ({ postId, likes, liked }) => {
//           setPendingLikes((prev) => {
//             const newSet = new Set(prev);
    
//             newSet.delete(postId);
    
//             return newSet;
//           });
    
//           usePostsStore.getState().updatePostLikes(postId, likes);
    
//           if (liked) {
//             setLocalLikedPosts((prev) => new Set([...prev, postId]));
//           } else {
//             setLocalLikedPosts((prev) => {
//               const newSet = new Set(prev);
    
//               newSet.delete(postId);
    
//               return newSet;
//             });
//           }
//         };
    
//         Socket.on("post-like-updated", handler);
    
//         return () => {
//           Socket.off("post-like-updated", handler);
//         };
//       }, []);

//        const handleAddComment = async (e) => {
//             e.preventDefault();
//             try {
//                 if (!comment.trim()) return;
//                 if (!ProfileData?._id) {
//                     console.log("User not logged in");
//                     return;
//                 }

//                 const postId = lesson._id;
//                 const PostownerId = lesson.author?._id;
    
//                 const res = await axios.post(
//                     `${import.meta.env.VITE_API_URL}/posts/comments/${postId}`,
//                     {
//                         userId: ProfileData._id,
//                         comment: comment.trim(),
//                         PostownerId: PostownerId,
//                     }
//                 );
    
//                 if (res.data.ok) {
//                     console.log("My comment", res.data.comment);
//                     setComments(prev => [res.data.comment, ...prev]);
//                     setComment("");
    
//                 }
//             } catch (err) {
//                 console.log(err?.response?.data?.message || err.message);
//             }
//         };
    
//         useEffect(() => {
//             const FetchComments = async () => {
//                 try {
//                     if (!lesson._id) return;

//                     const postId = lesson._id;
                    
//                     setLoading(true);
//                     const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/comments/${postId}`);
                    
//                     console.log('API Response:', res.data);
                    
//                     if (res.data.ok) {
//                         let commentsData = res.data.comments;
                        
//                         if (Array.isArray(commentsData)) {
//                             setComments(commentsData);
//                         } else if (commentsData && Array.isArray(commentsData.comments)) {
//                             setComments(commentsData.comments);
//                         } else {
//                             console.error('Unexpected comments format:', commentsData);
//                             setComments([]);
//                         }
//                     }
//                 } catch (err) {
//                     console.log('Error:', err?.response?.data || err.message);
//                     setComments([]);
//                 } finally {
//                     setLoading(false);
//                 }
//             }
            
//             FetchComments();
//         }, [lesson]);

//          useEffect(() => {
//     const handleKeyPress = (e) => {
//         // Ignore key presses when user is typing in specific elements
//         const excludedElements = [
//             'INPUT',
//             'TEXTAREA',
//             'SELECT'
//         ];
        
//         if (excludedElements.includes(e.target.tagName)) {
//             return;
//         }

//         // Additional check for contenteditable elements
//         if (e.target.isContentEditable) {
//             return;
//         }

//         if (!videoRef.current) return;
        
//         switch(e.key) {
//             case ' ':
//                 e.preventDefault();
//                 togglePlayPause();
//                 break;
//             case 'f':
//                 toggleFullScreen();
//                 break;
//             case 't':
//                 setShowTheaterMode(!showTheaterMode);
//                 break;
//             case 'm':
//                 toggleMute();
//                 break;
//             case 'ArrowRight':
//                 seek(5);
//                 break;
//             case 'ArrowLeft':
//                 seek(-5);
//                 break;
//             case 'ArrowUp':
//                 adjustVolume(0.1);
//                 break;
//             case 'ArrowDown':
//                 adjustVolume(-0.1);
//                 break;
//             case 'n':
//                 addTimestamp();
//                 break;
//             case 'c':
//                 setShowComments(!showComments);
//                 break;
//             default:
//                 break;
//         }
//     };

//     document.addEventListener('keydown', handleKeyPress);
//     return () => document.removeEventListener('keydown', handleKeyPress);
// }, [showTheaterMode, showComments, togglePlayPause, toggleFullScreen, toggleMute, seek, adjustVolume, addTimestamp]);

//     // const handleCommentSubmit = async (e) => {
//     //     e.preventDefault();
//     //     if (!comment.trim() || !ProfileData?._id || !lesson) return;
        
//     //     try {
//     //         const newComment = {
//     //             text: comment,
//     //             user: ProfileData._id,
//     //             createdAt: new Date().toISOString()
//     //         };
            
//     //         setComments(prev => [newComment, ...prev]);
//     //         setComment('');
            
//     //         Socket.emit("lesson-comment", {
//     //             lessonId: lesson._id,
//     //             userId: ProfileData._id,
//     //             comment: newComment.text,
//     //             toId: lesson.author?._id
//     //         });
            
//     //         addCommentToLesson(lesson._id, newComment);
//     //     } catch (error) {
//     //         console.error('Error adding comment:', error);
//     //     }
//     // };

//     const navigateToLesson = (newLessonId) => {
//         setSearchParams({ l: newLessonId });
        
//         window.scrollTo(0, 0);
//     };

//     const retryVideoLoad = () => {
//         setVideoError(null);
//         if (videoRef.current) {
//             videoRef.current.load();
//             videoRef.current.play().catch(console.error);
//         }
//     };

//     if (loading || isLoadingLesson) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center">
//                 <div className="flex flex-col items-center">
//                     <div className="relative">
//                         <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
//                         <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//                             <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full animate-pulse">
//                                 <img src="/LOGO/StudyVerseIcon.png" alt="Loading" />
//                             </div>
//                         </div>
//                     </div>
//                     <p className="text-lg font-medium mt-4 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
//                         Loading your lesson...
//                     </p>
//                 </div>
//             </div>
//         );
//     }

//     if (error || !lesson) {
//         return (
//             <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center p-4">
//                 <div className="text-center p-8 bg-neutral-800/70 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl">
//                     <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                     </div>
//                     <h2 className="text-2xl font-bold mb-4 text-white">Lesson Not Found</h2>
//                     <p className="text-neutral-300 mb-6">
//                         {error || 'The lesson you are looking for does not exist.'}
//                     </p>
//                     <button 
//                         onClick={() => navigate('/')}
//                         className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-purple-500/30 font-medium"
//                     >
//                         Back to Lessons
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className={`lenis min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white ${showTheaterMode ? 'pt-0' : ''}`}>
//             {!showTheaterMode && (
//                 <div className="sticky top-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-700/50">
//                     <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
//                         <button 
//                             onClick={() => navigate(-1)}
//                             className="flex items-center text-neutral-300 hover:text-white transition-colors"
//                         >
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                             </svg>
//                             Back
//                         </button>
                        
//                         <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
//                             StudyVerse
//                         </h1>
                        
//                         <div className="w-6"></div>
//                     </div>
//                 </div>
//             )}

//             <div className={`max-w-7xl mx-auto ${showTheaterMode ? 'px-0' : 'px-4 py-6 lg:py-8'}`}>
//                 <div className="flex flex-col lg:flex-row gap-8">
//                     <div className={`${showTheaterMode ? 'w-full' : 'flex-1'}`}>
//                         <div 
//                             ref={containerRef}
//                             className={`relative bg-black rounded-2xl overflow-hidden shadow-xl border border-neutral-700/30 group ${showTheaterMode ? 'rounded-none border-0' : ''}`}
//                             onMouseEnter={() => setShowControls(true)}
//                             onMouseLeave={() => {
//                                 if (isPlaying && !isSeeking) {
//                                     controlsTimeout.current = setTimeout(() => {
//                                         setShowControls(false);
//                                     }, 2000);
//                                 }
//                             }}
//                         >
//                             {lesson.files?.url && lesson.files.url.match(/\.(mp4|webm|ogg)$/) ? (
//                                 <>
//                                     <video
//                                         ref={videoRef}
//                                         src={lesson.files.url}
//                                         className="w-full h-full aspect-video object-contain"
//                                         poster={lesson.thumbnail}
//                                         onClick={togglePlayPause}
//                                         preload="auto"
//                                         autoPlay
//                                     />
                                    
//                                     {(isVideoLoading || isVideoWaiting) && (
//                                         <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//                                             <div className="flex flex-col items-center">
//                                                 <div className="relative">
//                                                     <div className="w-16 h-16 border-4 border-neutral-600/30 rounded-full"></div>
//                                                     <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent  border-t-red-600 rounded-full animate-spin"></div>
//                                                 </div>
//                                                 <p className="text-white mt-3 text-sm font-medium">
//                                                     {isVideoLoading ? 'Loading video...' : 'Buffering...'}
//                                                 </p>
//                                                 {isVideoWaiting && (
//                                                     <p className="text-neutral-400 text-xs mt-1">
//                                                         {bufferedProgress.toFixed(0)}% loaded
//                                                     </p>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     )}
                                    
//                                     {videoError && (
//                                         <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
//                                             <div className="text-center p-6 max-w-md">
//                                                 <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
//                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                                     </svg>
//                                                 </div>
//                                                 <h3 className="text-xl font-bold text-white mb-2">Video Error</h3>
//                                                 <p className="text-neutral-300 mb-4">{videoError}</p>
//                                                 <button 
//                                                     onClick={retryVideoLoad}
//                                                     className="px-6 py-2 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 font-medium"
//                                                 >
//                                                     Retry
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </>
//                             ) : (
//                                 <div className="w-full aspect-video bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center">
//                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//                                     </svg>
//                                 </div>
//                             )}

//                             {/* Improved Progress Bar */}
//                             <div 
//                                 className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
//                                 onClick={(e) => e.stopPropagation()}
//                             >
//                                 {/* Buffered Progress */}
//                                 <div 
//                                     className="w-full h-2 bg-neutral-600/20 cursor-pointer absolute top-0 left-0"
//                                 >
//                                     <div 
//                                         className="h-full bg-neutral-500/30 transition-all"
//                                         style={{ width: `${bufferedProgress}%` }}
//                                     ></div>
//                                 </div>
                                
//                                 {/* Main Progress Bar with improved interaction */}
//                                 <div 
//                                     ref={progressBarRef}
//                                     className="w-full h-1 bg-neutral-600/50 cursor-pointer group-hover:h-1 transition-all relative z-20"
//                                     onMouseDown={handleProgressMouseDown}
//                                     onTouchStart={handleProgressTouchStart}
//                                     onMouseMove={handleProgressMouseMove}
//                                     onTouchMove={handleProgressTouchMove}
//                                     onMouseUp={handleProgressMouseUp}
//                                     onTouchEnd={handleProgressTouchEnd}
//                                     onMouseLeave={() => {
//                                         if (!isSeeking) {
//                                             setSeekPreviewVisible(false);
//                                         }
//                                     }}
//                                 >
//                                     <div 
//                                         className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-200 relative z-10"
//                                         style={{ width: `${((isSeeking ? seekPreviewTime : currentTime) / duration) * 100}%` }}
//                                     >
//                                         {/* Progress bar thumb */}
//                                         <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
//                                     </div>
                                    
//                                     {/* Seek Preview Tooltip */}
//                                     {seekPreviewVisible && (
//                                         <div className="absolute bottom-full mb-2 left-0 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-30">
//                                             {formatTime(seekPreviewTime)}
//                                         </div>
//                                     )}
//                                 </div>
                                
//                                 <div className="flex items-center justify-between p-4 bg-gradient-to-t from-black/80 to-transparent">
//                                     <div className="flex items-center space-x-4">
//                                         <button 
//                                             className="text-white hover:text-purple-300 transition-colors"
//                                             onClick={togglePlayPause}
//                                             disabled={isVideoLoading || !!videoError}
//                                         >
//                                             {isPlaying ? (
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                                 </svg>
//                                             ) : (
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                                                 </svg>
//                                             )}
//                                         </button>
                                        
//                                         <div className="flex items-center space-x-2">
//                                             <button 
//                                                 className="text-white cursor-pointer hover:text-purple-300 transition-colors"
//                                                 onClick={toggleMute}
//                                             >
//                                                 {isMuted || volume === 0 ? (
//                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
//                                                     </svg>
//                                                 ) : volume > 0.5 ? (
//                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m-4.5-9.5L12 3v18l-4.5-4.5H4a1 1 0 01-1-1v-7a1 1 0 011-1h3.5z" />
//                                                     </svg>
//                                                 ) : (
//                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M4.5 6.5L12 3v18l-7.5-3.5H4a1 1 0 01-1-1v-7a1 1 0 011-1h3.5z" />
//                                                     </svg>
//                                                 )}
//                                             </button>
                                            
//                                             <input
//                                                 type="range"
//                                                 min="0"
//                                                 max="1"
//                                                 step="0.01"
//                                                 value={volume}
//                                                 onChange={handleVolumeChange}
//                                                 className="w-20 accent-purple-500 cursor-pointer"
//                                             />
//                                         </div>
                                        
//                                         <div className="text-white text-sm">
//                                             {formatTime(currentTime)} / {formatTime(duration)}
//                                         </div>
//                                     </div>
                                    
//                                     <div className="flex items-center space-x-4">
//                                         <div className="relative">
//                                             <button 
//                                                 className="text-white hover:text-purple-300 transition-colors"
//                                                 onClick={() => setShowSpeedMenu(!showSpeedMenu)}
//                                             >
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                                 </svg>
//                                             </button>
                                            
//                                             {showSpeedMenu && (
//                                                 <div className="absolute bottom-full mb-2 right-0 bg-neutral-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-neutral-700/50 py-2 z-50 min-w-[120px]">
//                                                     {playbackRates.map(rate => (
//                                                         <button
//                                                             key={rate}
//                                                             className={`block w-full text-left px-4 py-2 text-sm hover:bg-neutral-700/50 transition-colors ${playbackRate === rate ? 'text-purple-400 font-medium' : 'text-white'}`}
//                                                             onClick={() => changePlaybackRate(rate)}
//                                                         >
//                                                             {rate === 1 ? 'Normal' : `${rate}x`}
//                                                         </button>
//                                                     ))}
//                                                 </div>
//                                             )}
//                                         </div>
                                        
//                                         <button 
//                                             className="text-white hover:text-purple-300 transition-colors"
//                                             onClick={() => setShowTheaterMode(!showTheaterMode)}
//                                         >
//                                             {showTheaterMode ? (
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
//                                                 </svg>
//                                             ) : (
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
//                                                 </svg>
//                                             )}
//                                         </button>
                                        
//                                         <button 
//                                             className="text-white hover:text-purple-300 transition-colors"
//                                             onClick={toggleFullScreen}
//                                         >
//                                             {isFullScreen ? (
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                                 </svg>
//                                             ) : (
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
//                                                 </svg>
//                                             )}
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Video Info Section */}
//                         <div className="mt-6 bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30">
//                             <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
//                                 <div className="flex-1">
//                                     <h1 className="text-2xl font-bold text-white mb-2">
//                                         {lesson.heading}
//                                     </h1>
//                                     <p className="text-neutral-300 mb-4">
//                                         {lesson.description}
//                                     </p>
                                    
//                                     <div className="flex items-center space-x-4 text-sm text-neutral-400">
//                                         <span>{lesson.views || 0} views</span>
//                                         <span>•</span>
//                                         <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
//                                         {lesson.duration && (
//                                             <>
//                                                 <span>•</span>
//                                                 <span>{lesson.duration}</span>
//                                             </>
//                                         )}
//                                     </div>
//                                 </div>
                                
//                                 <div className="flex items-center space-x-3">
//                                     <LikeComponent
//                                         PostId={lesson?._id}
//                                         PostAuthorId={lesson?.author?._id}
//                                         CurrentUserId={ProfileData?._id}
//                                         LikeLength={likeCount}
//                                         isVideo={true}
//                                     />
                                    
//                                     <button 
//                                         className="flex items-center space-x-2 bg-neutral-700/50 hover:bg-neutral-600/50 px-4 py-2 rounded-full transition-colors"
//                                         onClick={() => setShowShareModal(true)}
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
//                                         </svg>
//                                         <span>Share</span>
//                                     </button>
                                    
//                                     <button 
//                                         className="flex items-center space-x-2 bg-neutral-700/50 hover:bg-neutral-600/50 px-4 py-2 rounded-full transition-colors"
//                                         onClick={downloadLesson}
//                                         disabled={isDownloading}
//                                     >
//                                         {isDownloading ? (
//                                             <>
//                                                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                                                 <span>{downloadProgress}%</span>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//                                                 </svg>
//                                                 <span>Download</span>
//                                             </>
//                                         )}
//                                     </button>
//                                 </div>
//                             </div>
                            
//                             <div className="flex items-center space-x-4 pt-4 border-t border-neutral-700/50">
//                                 <div className="flex items-center space-x-3">
//                                     <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
//                                         {lesson.author?.name?.charAt(0) || 'U'}
//                                     </div>
//                                     <div>
//                                         <h3 className="font-medium text-white">
//                                             {lesson.author?.name || 'Unknown Author'}
//                                         </h3>
//                                         <p className="text-sm text-neutral-400">
//                                             {lesson.author?.followers?.length || 0} followers
//                                         </p>
//                                     </div>
//                                 </div>
                                
//                                 <button className="ml-auto bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-0.5">
//                                     Follow
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Tabs for Notes and Comments */}
//                         <div className="mt-6 bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/30 overflow-hidden">
//                             <div className="flex border-b border-neutral-700/50">
//                                 <button 
//                                     className={`flex-1 py-4 text-center font-medium transition-colors ${showComments ? 'text-white bg-neutral-700/30' : 'text-neutral-400 hover:text-white'}`}
//                                     onClick={() => setShowComments(true)}
//                                 >
//                                     Comments ({comments.length})
//                                 </button>
//                                 <button 
//                                     className={`flex-1 py-4 text-center font-medium transition-colors ${!showComments ? 'text-white bg-neutral-700/30' : 'text-neutral-400 hover:text-white'}`}
//                                     onClick={() => setShowComments(false)}
//                                 >
//                                     Notes & Timestamps
//                                 </button>
//                             </div>
                            
//                             <div className="p-6">
//                                 {showComments ? (
//                                     <div>
//                                         <form onSubmit={(e) => handleAddComment(e)} className="mb-6">
//                                             <div className="flex space-x-3">
//                                                 <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
//                                                     {ProfileData?.name?.charAt(0) || 'U'}
//                                                 </div>
//                                                 <div className="flex-1">
//                                                     <input
//                                                         ref={commentInputRef}
//                                                         type="text"
//                                                         value={comment}
//                                                         onChange={(e) => setComment(e.target.value)}
//                                                         placeholder="Add a comment..."
//                                                         className="w-full bg-neutral-700/50 border border-neutral-600/50 rounded-full px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                                                         disabled={!ProfileData?._id}
//                                                     />
//                                                 </div>
//                                                 <button 
//                                                     type="submit"
//                                                     className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 px-6 py-3 rounded-full font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
//                                                     disabled={!comment.trim() || !ProfileData?._id}
//                                                 >
//                                                     Comment
//                                                 </button>
//                                             </div>
//                                         </form>
                                        
//                                         <div className="space-y-4">
//                                             {comments.length === 0 ? (
//                                                 <div className="text-center py-8 text-neutral-400">
//                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                                                     </svg>
//                                                     <p>No comments yet. Be the first to comment!</p>
//                                                 </div>
//                                             ) : (
//                                                 comments.map((comment, index) => (
//                                                     <div key={index} className="flex space-x-3">
//                                                         <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
//                                                             {comment.author?.avatar ? (
//                                                                 <img 
//                                                                     src={comment.author.avatar} 
//                                                                     alt={`${comment.author.firstName} ${comment.author.lastName}`}
//                                                                     className="w-10 h-10 rounded-full object-cover flex-shrink-0"
//                                                                 />
//                                                             ) : (
//                                                                 <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
//                                                                     {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                         <div className="flex-1">
//                                                             <div className="bg-neutral-700/30 rounded-2xl p-4">
//                                                                 <div className="flex items-center justify-between mb-2">
//                                                                     <h4 className="text-white font-bold ">
//                                                                         {comment.author?.firstName} {comment.author?.lastName}
//                                                                     </h4>
//                                                                     <span className="text-xs text-neutral-400">
//                                                                         {new Date(comment.createdAt).toLocaleDateString()}
//                                                                     </span>
//                                                                 </div>
//                                                                 <p className="text-neutral-300">
//                                                                     {comment.content}
//                                                                 </p>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 ))
//                                             )}
//                                         </div>
//                                     </div>
//                                 ) : (
//                                     <div>
//                                         <div className="flex items-center justify-between mb-4">
//                                             <h3 className="text-lg font-medium text-white">Your Notes</h3>
//                                             <button 
//                                                 className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
//                                                 onClick={addTimestamp}
//                                             >
//                                                 Add Timestamp
//                                             </button>
//                                         </div>
                                        
//                                         <textarea
//                                             ref={notesRef}
//                                             value={userNotes}
//                                             onChange={(e) => setUserNotes(e.target.value)}
//                                             onBlur={saveUserNotes}
//                                             placeholder="Take notes while watching... Click 'Add Timestamp' to mark important moments."
//                                             className="w-full h-32 bg-neutral-700/50 border border-neutral-600/50 rounded-2xl px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
//                                         />
                                        
//                                         {savedTimestamps.length > 0 && (
//                                             <div className="mt-6">
//                                                 <h4 className="font-medium text-white mb-3">Timestamps</h4>
//                                                 <div className="space-y-2">
//                                                     {savedTimestamps.map((timestamp, index) => (
//                                                         <button
//                                                             key={index}
//                                                             className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
//                                                             onClick={() => jumpToTimestamp(timestamp.time)}
//                                                         >
//                                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                                                             </svg>
//                                                             <span>{formatTime(timestamp.time)}</span>
//                                                             <span className="text-neutral-400 text-sm">- {timestamp.note || 'No note'}</span>
//                                                         </button>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
                    
//                     {/* Related Lessons Sidebar */}
//                     {!showTheaterMode && (
//                         <div className="lg:w-80 space-y-6">
//                             <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30">
//                                 <h3 className="text-lg font-semibold text-white mb-4">Related Lessons</h3>
                                
//                                 {isLoadingRelated ? (
//                                     <div className="space-y-3">
//                                         {[1, 2, 3].map(i => (
//                                             <div key={i} className="animate-pulse">
//                                                 <div className="bg-neutral-700/50 rounded-lg h-20 mb-2"></div>
//                                                 <div className="bg-neutral-700/50 rounded h-3 w-3/4 mb-1"></div>
//                                                 <div className="bg-neutral-700/50 rounded h-3 w-1/2"></div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 ) : relatedLessons.length > 0 ? (
//                                     <div className="space-y-4">
//                                         {relatedLessons.map(relatedLesson => (
//                                             <div 
//                                                 key={relatedLesson._id}
//                                                 className="flex space-x-3 cursor-pointer hover:bg-neutral-700/30 p-2 rounded-xl transition-colors"
//                                                 onClick={() => navigateToLesson(relatedLesson._id)}
//                                             >
//                                                 <div className="w-24 h-16 bg-gradient-to-r from-purple-600 to-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
//                                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                                                     </svg>
//                                                 </div>
//                                                 <div className="flex-1 min-w-0">
//                                                     <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
//                                                         {relatedLesson.heading}
//                                                     </h4>
//                                                     <p className="text-xs text-neutral-400">
//                                                         {relatedLesson.author?.name}
//                                                     </p>
//                                                     <div className="flex items-center space-x-2 text-xs text-neutral-500 mt-1">
//                                                         <span>{relatedLesson.views || 0} views</span>
//                                                         <span>•</span>
//                                                         <span>{new Date(relatedLesson.createdAt).toLocaleDateString()}</span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 ) : (
//                                     <div className="text-center py-4 text-neutral-400">
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//                                         </svg>
//                                         <p>No related lessons found</p>
//                                     </div>
//                                 )}
//                             </div>
                            
//                             {/* Quick Actions */}
//                             <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-700/30">
//                                 <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
//                                 <div className="space-y-3">
//                                     <button 
//                                         className="w-full flex items-center space-x-3 bg-neutral-700/30 hover:bg-neutral-600/30 p-3 rounded-xl transition-colors"
//                                         onClick={() => setShowNotes(!showNotes)}
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                                         </svg>
//                                         <span className="text-white">Take Notes</span>
//                                     </button>
                                    
//                                     <button 
//                                         className="w-full flex items-center space-x-3 bg-neutral-700/30 hover:bg-neutral-600/30 p-3 rounded-xl transition-colors"
//                                         onClick={downloadLesson}
//                                         disabled={isDownloading}
//                                     >
//                                         {isDownloading ? (
//                                             <>
//                                                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                                                 <span className="text-white">Downloading... {downloadProgress}%</span>
//                                             </>
//                                         ) : (
//                                             <>
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//                                                 </svg>
//                                                 <span className="text-white">Download Lesson</span>
//                                             </>
//                                         )}
//                                     </button>
                                    
//                                     <button 
//                                         className="w-full flex items-center space-x-3 bg-neutral-700/30 hover:bg-neutral-600/30 p-3 rounded-xl transition-colors"
//                                         onClick={() => setShowShareModal(true)}
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
//                                         </svg>
//                                         <span className="text-white">Share with Peers</span>
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Share Modal */}
//             {showShareModal && (
//                 <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//                     <div className="bg-neutral-800/95 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-md w-full p-6">
//                         <div className="flex items-center justify-between mb-4">
//                             <h3 className="text-lg font-semibold text-white">Share Lesson</h3>
//                             <button 
//                                 className="text-neutral-400 hover:text-white transition-colors"
//                                 onClick={() => setShowShareModal(false)}
//                             >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                 </svg>
//                             </button>
//                         </div>
                        
//                         <div className="space-y-4">
//                             <div>
//                                 <label className="text-sm text-neutral-400 mb-2 block">Share with peers</label>
//                                 <div className="max-h-48 overflow-y-auto space-y-2">
//                                     {peersList.length > 0 ? (
//                                         peersList.map(peer => (
//                                             <div key={peer._id} className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-xl">
//                                                 <div className="flex items-center space-x-3">
//                                                     <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
//                                                         {peer.name?.charAt(0) || 'P'}
//                                                     </div>
//                                                     <span className="text-white">{peer.name}</span>
//                                                 </div>
//                                                 <button 
//                                                     className="text-purple-400 hover:text-purple-300 text-sm font-medium"
//                                                     onClick={() => shareLessonWithPeer(peer._id)}
//                                                 >
//                                                     Share
//                                                 </button>
//                                             </div>
//                                         ))
//                                     ) : (
//                                         <div className="text-center py-4 text-neutral-400">
//                                             <p>No peers found</p>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
                            
//                             <div>
//                                 <label className="text-sm text-neutral-400 mb-2 block">Copy link</label>
//                                 <div className="flex space-x-2">
//                                     <input 
//                                         type="text" 
//                                         value={`${window.location.origin}${window.location.pathname}?l=${lesson._id}`}
//                                         readOnly
//                                         className="flex-1 bg-neutral-700/50 border border-neutral-600/50 rounded-lg px-3 py-2 text-white text-sm"
//                                     />
//                                     <button 
//                                         className="bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
//                                         onClick={() => navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?l=${lesson._id}`)}
//                                     >
//                                         Copy
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Video;

















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
    const [localLikedPosts, setLocalLikedPosts] = useState(new Set());
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
    
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekPreviewTime, setSeekPreviewTime] = useState(0);
    const [seekPreviewVisible, setSeekPreviewVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const videoRef = useRef(null);
    const controlsTimeout = useRef(null);
    const containerRef = useRef(null);
    const commentInputRef = useRef(null);
    const notesRef = useRef(null);
    const progressBarRef = useRef(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const lessonId = searchParams.get('l');
    const [Loading, setLoading] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        const handleFullScreenChange = () => {
            const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
            setIsFullScreen(!!fullscreenElement);
            
            if (isMobile && fullscreenElement) {
                screen.orientation?.lock?.('landscape').catch(() => {});
            } else if (isMobile && !fullscreenElement) {
                screen.orientation?.unlock?.();
            }
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
        document.addEventListener('msfullscreenchange', handleFullScreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
            document.removeEventListener('msfullscreenchange', handleFullScreenChange);
        };
    }, [isMobile]);

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
                if (!isSeeking) {
                    setCurrentTime(video.currentTime);
                }
                
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
    }, [lesson, isSeeking]);

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
                if (isPlaying && !isSeeking) {
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
    }, [isPlaying, isSeeking]);

    const handleProgressClick = (e) => {
        if (!progressBarRef.current || !videoRef.current) return;
        
        const progressBar = progressBarRef.current;
        const rect = progressBar.getBoundingClientRect();
        const clickPosition = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const progressBarWidth = progressBar.offsetWidth;
        const newTime = (clickPosition / progressBarWidth) * duration;
        
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        
        if (isPlaying) {
            videoRef.current.play().catch(console.error);
        }
    };

    const handleProgressMouseDown = (e) => {
        setIsSeeking(true);
        setShowControls(true);
        handleProgressMove(e);
    };

    const handleProgressTouchStart = (e) => {
        setIsSeeking(true);
        setShowControls(true);
        handleProgressMove(e.touches[0]);
    };

    const handleProgressMove = (e) => {
        if (!isSeeking || !progressBarRef.current) return;
        
        const progressBar = progressBarRef.current;
        const rect = progressBar.getBoundingClientRect();
        const clickPosition = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const progressBarWidth = progressBar.offsetWidth;
        const newTime = (clickPosition / progressBarWidth) * duration;
        
        setSeekPreviewTime(newTime);
        setSeekPreviewVisible(true);
    };

    const handleProgressMouseUp = () => {
        if (!isSeeking || !videoRef.current) return;
        
        videoRef.current.currentTime = seekPreviewTime;
        setCurrentTime(seekPreviewTime);
        setIsSeeking(false);
        setSeekPreviewVisible(false);
        
        if (isPlaying) {
            videoRef.current.play().catch(console.error);
        }
    };

    const handleProgressMouseMove = (e) => {
        if (isSeeking) {
            handleProgressMove(e);
        }
    };

    const handleProgressTouchMove = (e) => {
        if (isSeeking && e.touches.length > 0) {
            handleProgressMove(e.touches[0]);
        }
    };

    const handleProgressTouchEnd = () => {
        handleProgressMouseUp();
    };

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
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            const container = containerRef.current;
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            } else if (container.webkitEnterFullscreen) {
                container.webkitEnterFullscreen();
            }
            
            if (isMobile) {
                setTimeout(() => {
                    screen.orientation?.lock?.('landscape').catch(() => {});
                }, 100);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            if (isMobile) {
                screen.orientation?.unlock?.();
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

    useEffect(() => {
        const handler = ({ postId, likes, liked }) => {
          setLocalLikedPosts((prev) => {
            const newSet = new Set(prev);
    
            if (liked) {
              newSet.add(postId);
            } else {
              newSet.delete(postId);
            }
    
            return newSet;
          });
    
          useLessonStore.getState().updateLessonLikes(postId, likes);
    
          if (postId === lesson?._id) {
            setLikeCount(likes.length);
            setIsLiked(liked);
          }
        };
    
        Socket.on("post-like-updated", handler);
    
        return () => {
          Socket.off("post-like-updated", handler);
        };
      }, [lesson]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        try {
            if (!comment.trim()) return;
            if (!ProfileData?._id) {
                console.log("User not logged in");
                return;
            }

            const postId = lesson._id;
            const PostownerId = lesson.author?._id;

            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/posts/comments/${postId}`,
                {
                    userId: ProfileData._id,
                    comment: comment.trim(),
                    PostownerId: PostownerId,
                }
            );

            if (res.data.ok) {
                console.log("My comment", res.data.comment);
                setComments(prev => [res.data.comment, ...prev]);
                setComment("");

            }
        } catch (err) {
            console.log(err?.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        const FetchComments = async () => {
            try {
                if (!lesson?._id) return;

                const postId = lesson._id;
                
                setLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/comments/${postId}`);
                
                console.log('API Response:', res.data);
                
                if (res.data.ok) {
                    let commentsData = res.data.comments;
                    
                    if (Array.isArray(commentsData)) {
                        setComments(commentsData);
                    } else if (commentsData && Array.isArray(commentsData.comments)) {
                        setComments(commentsData.comments);
                    } else {
                        console.error('Unexpected comments format:', commentsData);
                        setComments([]);
                    }
                }
            } catch (err) {
                console.log('Error:', err?.response?.data || err.message);
                setComments([]);
            } finally {
                setLoading(false);
            }
        }
        
        if (lesson?._id) {
            FetchComments();
        }
    }, [lesson]);

    useEffect(() => {
        const handleKeyPress = (e) => {
            const excludedElements = [
                'INPUT',
                'TEXTAREA',
                'SELECT'
            ];
            
            if (excludedElements.includes(e.target.tagName)) {
                return;
            }

            if (e.target.isContentEditable) {
                return;
            }

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
                                if (isPlaying && !isSeeking) {
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
                                >
                                    <div 
                                        className="h-full bg-neutral-500/30 transition-all"
                                        style={{ width: `${bufferedProgress}%` }}
                                    ></div>
                                </div>
                                
                                <div 
                                    ref={progressBarRef}
                                    className="w-full h-1 bg-neutral-600/50 cursor-pointer group-hover:h-1 transition-all relative z-20"
                                    onMouseDown={handleProgressMouseDown}
                                    onTouchStart={handleProgressTouchStart}
                                    onMouseMove={handleProgressMouseMove}
                                    onTouchMove={handleProgressTouchMove}
                                    onMouseUp={handleProgressMouseUp}
                                    onTouchEnd={handleProgressTouchEnd}
                                    onClick={handleProgressClick}
                                    onMouseLeave={() => {
                                        if (!isSeeking) {
                                            setSeekPreviewVisible(false);
                                        }
                                    }}
                                >
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-200 relative z-10"
                                        style={{ width: `${((isSeeking ? seekPreviewTime : currentTime) / duration) * 100}%` }}
                                    >
                                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </div>
                                    
                                    {seekPreviewVisible && (
                                        <div className="absolute bottom-full mb-2 left-0 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-30">
                                            {formatTime(seekPreviewTime)}
                                        </div>
                                    )}
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
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </button>
                                        
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                className="text-white hover:text-purple-300 transition-colors"
                                                onClick={toggleMute}
                                            >
                                                {isMuted || volume === 0 ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                                    </svg>
                                                ) : volume > 0.5 ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a7.975 7.975 0 014.242 1.226" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                )}
                                            </button>
                                            
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={volume}
                                                onChange={handleVolumeChange}
                                                className="w-20 accent-purple-500 cursor-pointer"
                                            />
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 text-sm">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>/</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <button 
                                                className="text-white hover:text-purple-300 transition-colors text-sm font-medium"
                                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                            >
                                                {playbackRate}x
                                            </button>
                                            
                                            {showSpeedMenu && (
                                                <div className="absolute bottom-full mb-2 right-0 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-2 min-w-[100px] z-50">
                                                    {playbackRates.map(rate => (
                                                        <button
                                                            key={rate}
                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-700 transition-colors ${rate === playbackRate ? 'text-purple-400 font-medium' : 'text-white'}`}
                                                            onClick={() => changePlaybackRate(rate)}
                                                        >
                                                            {rate}x
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={() => setShowTheaterMode(!showTheaterMode)}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                            </svg>
                                        </button>
                                        
                                        <button 
                                            className="text-white hover:text-purple-300 transition-colors"
                                            onClick={toggleFullScreen}
                                        >
                                            {isFullScreen ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/30 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                                        {lesson.heading}
                                    </h1>
                                    <p className="text-neutral-300 text-sm lg:text-base">
                                        {lesson.description}
                                    </p>
                                </div>
                                
                                <div className="flex items-center space-x-3 ml-4">
                                    <LikeComponent 
                                        postId={lesson._id}
                                        likes={lesson.likes || []}
                                        isLiked={isLiked}
                                        setIsLiked={setIsLiked}
                                        likeCount={likeCount}
                                        setLikeCount={setLikeCount}
                                    />
                                    
                                    <button 
                                        className="flex items-center space-x-2 text-neutral-300 hover:text-white transition-colors"
                                        onClick={() => setShowShareModal(true)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-neutral-400">
                                <div className="flex items-center space-x-4">
                                    <span>By {lesson.author?.username || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    <button 
                                        className="flex items-center space-x-1 text-neutral-300 hover:text-white transition-colors"
                                        onClick={() => setShowNotes(!showNotes)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span>Notes</span>
                                    </button>
                                    
                                    <button 
                                        className="flex items-center space-x-1 text-neutral-300 hover:text-white transition-colors"
                                        onClick={downloadLesson}
                                        disabled={isDownloading}
                                    >
                                        {isDownloading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
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
                        </div>

                        {showNotes && (
                            <div className="mt-6 bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/30 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-white">My Notes</h3>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            className="px-3 py-1 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full text-sm font-medium hover:from-purple-500 hover:to-amber-400 transition-all"
                                            onClick={addTimestamp}
                                        >
                                            Add Timestamp
                                        </button>
                                        <button 
                                            className="px-3 py-1 bg-neutral-700 rounded-full text-sm font-medium hover:bg-neutral-600 transition-all"
                                            onClick={saveUserNotes}
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                                
                                <textarea
                                    ref={notesRef}
                                    value={userNotes}
                                    onChange={(e) => setUserNotes(e.target.value)}
                                    placeholder="Take notes while watching..."
                                    className="w-full h-40 bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                                />
                                
                                {savedTimestamps.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-sm font-medium text-neutral-300 mb-2">Timestamps</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {savedTimestamps.map((timestamp, index) => (
                                                <button
                                                    key={index}
                                                    className="px-3 py-1 bg-neutral-700/50 rounded-full text-xs text-neutral-300 hover:bg-neutral-600 transition-colors"
                                                    onClick={() => jumpToTimestamp(timestamp.time)}
                                                >
                                                    {formatTime(timestamp.time)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {showComments && (
                            <div className="mt-6 bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/30 p-6">
                                <h3 className="text-xl font-semibold text-white mb-4">Comments</h3>
                                
                                <form onSubmit={handleAddComment} className="mb-6">
                                    <div className="flex space-x-3">
                                        <div className="flex-1">
                                            <input
                                                ref={commentInputRef}
                                                type="text"
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Add a comment..."
                                                className="w-full bg-neutral-900/50 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!comment.trim()}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full font-medium hover:from-purple-500 hover:to-amber-400 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </form>
                                
                                <div className="space-y-4">
                                    {Loading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                                        </div>
                                    ) : comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <div key={comment._id} className="bg-neutral-900/30 rounded-xl p-4 border border-neutral-700/30">
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                            {comment.userId?.username?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="font-medium text-white">
                                                                {comment.userId?.username || 'Unknown User'}
                                                            </span>
                                                            <span className="text-xs text-neutral-400">
                                                                {new Date(comment.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-neutral-300 text-sm">
                                                            {comment.comment}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-neutral-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <p>No comments yet. Be the first to comment!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {!showTheaterMode && (
                        <div className="lg:w-80 space-y-6">
                            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/30 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Related Lessons</h3>
                                
                                {isLoadingRelated ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse">
                                                <div className="w-full aspect-video bg-neutral-700 rounded-xl mb-2"></div>
                                                <div className="h-4 bg-neutral-700 rounded mb-1"></div>
                                                <div className="h-3 bg-neutral-700 rounded w-2/3"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : relatedLessons.length > 0 ? (
                                    <div className="space-y-4">
                                        {relatedLessons.map(relatedLesson => (
                                            <div 
                                                key={relatedLesson._id}
                                                className="cursor-pointer group"
                                                onClick={() => navigateToLesson(relatedLesson._id)}
                                            >
                                                <div className="relative overflow-hidden rounded-xl bg-black">
                                                    {relatedLesson.files?.url && relatedLesson.files.url.match(/\.(mp4|webm|ogg)$/) ? (
                                                        <video
                                                            src={relatedLesson.files.url}
                                                            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                                                            poster={relatedLesson.thumbnail}
                                                        />
                                                    ) : (
                                                        <div className="w-full aspect-video bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                                        <h4 className="text-white font-medium text-sm line-clamp-2">
                                                            {relatedLesson.heading}
                                                        </h4>
                                                        <p className="text-neutral-300 text-xs mt-1">
                                                            {relatedLesson.author?.username || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-neutral-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <p>No related lessons found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showShareModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-white">Share Lesson</h3>
                            <button 
                                onClick={() => setShowShareModal(false)}
                                className="text-neutral-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {peersList.length > 0 ? (
                                peersList.map(peer => (
                                    <div key={peer._id} className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                {peer.username?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{peer.username}</p>
                                                <p className="text-neutral-400 text-sm">{peer.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => shareLessonWithPeer(peer._id)}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full text-sm font-medium hover:from-purple-500 hover:to-amber-400 transition-all"
                                        >
                                            Share
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-neutral-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p>No connections found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Video; 