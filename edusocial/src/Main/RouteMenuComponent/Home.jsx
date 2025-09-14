// import React, { useState, useEffect, useRef } from 'react';
// import axios from 'axios';
// import Lenis from "@studio-freight/lenis";
// import { usePostsStore } from '../../StateManagement/StoreNotes';
// import Socket from '../../SocketConnection/Socket';


// const StudyVerseMain = () => {
//   // const [posts, setPosts] = useState([]);
//   // const [loading, setLoading] = useState(true);
//   // const [error, setError] = useState(null);
//   const [likedPosts, setLikedPosts] = useState(new Set());
//   const [activePost, setActivePost] = useState(null);
//   const videoRefs = useRef({});
//   const observer = useRef(null);
//   const { posts, loading, error, fetchPosts, clearPosts } = usePostsStore();

//  useEffect(() => {
//   console.log("Lenis init 🚀");

//   const lenis = new Lenis({
//     duration: 1.2,
//     smoothWheel: true,
//     smoothTouch: true,
//     touchMultiplier: 1.5,
//     wheelMultiplier: 1.2,
//     gestureOrientation: 'vertical',
//   });

//   function raf(time) {
//     lenis.raf(time);
//     requestAnimationFrame(raf);
//   }

//   requestAnimationFrame(raf);

//   lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
//     console.log("Lenis Scroll:", scroll, "/", limit);
    
//     if (observer.current) {
//       observer.current.disconnect();
      
//       Object.values(videoRefs.current).forEach(video => {
//         if (video) {
//           observer.current.observe(video);
//         }
//       });
//     }
//   });

//   return () => {
//     lenis.destroy();
//   };
// }, []);

// observer.current = new IntersectionObserver(
//   (entries) => {
//     entries.forEach((entry) => {
//       const videoId = entry.target.dataset.videoId;
//       const videoElement = videoRefs.current[videoId];
      
//       if (videoElement) {
//         if (entry.isIntersecting) {
//           // Video is in viewport - play it
//           setActivePost(videoId);
//           // Mute the video for autoplay to work
//           videoElement.muted = true;
//           videoElement.play().catch(error => {
//             console.log('Autoplay prevented:', error);
//           });
//         } else {
//           // Video is out of viewport - pause it
//           if (activePost === videoId) {
//             setActivePost(null);
//           }
//           videoElement.pause();
//         }
//       }
//     });
//   },
//   {
//     threshold: 0.6, 
//     rootMargin: '0px 0px -10% 0px'
//   }
// );


//   // const fetchPosts = async () => {
//   //   try {
//   //     setLoading(true);
//   //     const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
      
//   //     if (response.data.ok) {
//   //       setPosts(response.data.posts.reverse());
//   //     } else {
//   //       throw new Error(response.data.message);
//   //     }
//   //   } catch (err) {
//   //     console.error('Error fetching posts:', err);
//   //     setError('Failed to load posts. Please try again later.');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   // useEffect(() => {    
//   //   fetchPosts();
//   // }, []);

//   useEffect(() => {
//     fetchPosts();
//   }, [fetchPosts]);

//   useEffect(() => {
//   const handler = ({ Fetch }) => {
//     console.log("Fetch front", Fetch);
//     if (Fetch) {
//       clearPosts();
//       console.log("Fetch")
//       fetchPosts();
//     }
//   };

//   Socket.on("FetchAgain", handler);

//   return () => {
//     Socket.off("FetchAgain", handler);
//   };
// }, []);


//   // Set up Intersection Observer for video elements
//   useEffect(() => {
//     if (posts.length === 0) return;

//     // Create Intersection Observer
//     observer.current = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           const videoId = entry.target.dataset.videoId;
//           const videoElement = videoRefs.current[videoId];
          
//           if (videoElement) {
//             if (entry.isIntersecting) {
//               // Video is in viewport - play it
//               setActivePost(videoId);
//               // Mute the video for autoplay to work
//               videoElement.muted = true;
//               videoElement.play().catch(error => {
//                 console.log('Autoplay prevented:', error);
//               });
//             } else {
//               // Video is out of viewport - pause it
//               if (activePost === videoId) {
//                 setActivePost(null);
//               }
//               videoElement.pause();
//             }
//           }
//         });
//       },
//       {
//         threshold: 0.7,
//         rootMargin: '0px 0px -15% 0px'
//       }
//     );

//     // Observe all video elements
//     Object.values(videoRefs.current).forEach(video => {
//       if (video) {
//         observer.current.observe(video);
//       }
//     });

//     // Cleanup function
//     return () => {
//       if (observer.current) {
//         observer.current.disconnect();
//       }
//     };
//   }, [posts, activePost]);

//   const handleLike = async (postId) => {
//     try {
//       const newLikedPosts = new Set(likedPosts);
//       if (newLikedPosts.has(postId)) {
//         newLikedPosts.delete(postId);
//       } else {
//         newLikedPosts.add(postId);
//       }
//       setLikedPosts(newLikedPosts);

//       await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`);
//     } catch (err) {
//       console.error('Error liking post:', err);
//       const revertedLikedPosts = new Set(likedPosts);
//       if (revertedLikedPosts.has(postId)) {
//         revertedLikedPosts.delete(postId);
//       } else {
//         revertedLikedPosts.add(postId);
//       }
//       setLikedPosts(revertedLikedPosts);
//     }
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffTime = Math.abs(now - date);
//     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
//     const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
//     const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
//     if (diffMinutes < 1) return 'Just now';
//     if (diffMinutes < 60) return `${diffMinutes}m ago`;
//     if (diffHours < 24) return `${diffHours}h ago`;
//     if (diffDays === 1) return 'Yesterday';
//     if (diffDays < 7) return `${diffDays}d ago`;
    
//     return date.toLocaleDateString('en-US', { 
//       month: 'short', 
//       day: 'numeric',
//       year: diffDays > 365 ? 'numeric' : undefined
//     });
//   };

//   const handleVideoClick = (postId, e) => {
//     // Prevent event bubbling to avoid multiple triggers
//     e.stopPropagation();
    
//     const videoElement = videoRefs.current[postId];
//     console.log('Video element:', videoElement);
//     console.log('Video paused state:', videoElement?.paused);
    
//     if (videoElement) {
//       if (videoElement.paused) {
//         // Unmute when user manually plays
//         videoElement.muted = false;
//         videoElement.play().then(() => {
//           setActivePost(postId);
//           console.log('Video playing');
//         }).catch(error => {
//           console.log('Play failed:', error);
//         });
//       } else {
//         videoElement.pause();
//         setActivePost(null);
//         console.log('Video paused');
//       }
//     }
//   };

//   // Add a function to handle video play state changes
//   const handleVideoPlay = (postId) => {
//     setActivePost(postId);
//   };

//   const handleVideoPause = (postId) => {
//     if (activePost === postId) {
//       setActivePost(null);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center p-4">
//         <div className="flex flex-col items-center">
//           <div className="relative">
//             <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
//             <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
//               <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full animate-pulse">
//                 <img src="/LOGO/StudyVerseIcon.png" alt="Loading" />
//               </div>
//             </div>
//           </div>
//           <p className="text-lg font-medium mt-4 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
//             Loading study materials...
//           </p>
//           <p className="text-neutral-400 text-sm mt-2">Preparing your learning journey</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center p-4">
//         <div className="text-center p-8 bg-neutral-800/70 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h2 className="text-2xl font-bold mb-4 text-white">Oops! Something went wrong</h2>
//           <p className="text-neutral-300 mb-6">{error}</p>
//           <button 
//             onClick={() => fetchPosts()} 
//             className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-purple-500/30 font-medium"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="lenis min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white py-8">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        // <div className='md:hidden'>
          // <nav className='fixed z-30 gap-0 top-0 left-0 w-full h-15'>
          //   <div className='h-20 backdrop-blur-sm overflow-hidden flex items-center'>
          //     <img src="/LOGO/StudyVerseLogo2.png" className='h-30 object-cover' alt="" />
          //   </div>
          //   <div className='py-1 px-1'>
          //     <input type="text" className='bg-neutral-800 p-2 px-4 w-full rounded-2xl placeholder:text-white text-white outline-none' placeholder='Enter data' />
          //   </div>
          // </nav>
        // </div>
//         <div className="text-center mb-12 md:mt-0 mt-25">
//           <div className="hidden md:inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-amber-500 rounded-2xl mb-6 shadow-lg">
//             <img src='/LOGO/StudyVerseIcon.png' alt="" />
//           </div>
//           <h1 className="text-4xl mt-5 md:mt-0 md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent mb-4">
//             StudyVerse Community
//           </h1>
//           <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
//             Discover, share and collaborate on the best study materials
//           </p>
//           <div className="mt-6 flex justify-center space-x-4">
//             <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//               </svg>
//               Notes
//             </span>
//             <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
//               </svg>
//               Videos
//             </span>
//             <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//               </svg>
//               PDFs
//             </span>
//           </div>
//         </div>

//         {posts.length === 0 ? (
//           <div className="text-center py-16 bg-neutral-800/40 rounded-3xl border border-neutral-700/30 backdrop-blur-sm">
//             <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-700/30 rounded-3xl mb-6">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//               </svg>
//             </div>
//             <h3 className="text-2xl font-semibold text-white mb-3">No study materials yet</h3>
//             <p className="text-neutral-400 max-w-md mx-auto mb-6">
//               Be the first to share your knowledge and help others learn
//             </p>
//             <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500/20">
//               Create First Post
//             </button>
//           </div>
//         ) : (
//           <div className="space-y-8">
//             {posts.map((post) => (
//               <div 
//                 key={post._id} 
//                 className="bg-neutral-800/40 max-w-2xl mx-auto backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl hover:shadow-neutral-900/30 transition-all duration-300 border border-neutral-700/30 hover:border-neutral-600/50"
//               >
//                 {/* Post Header */}
//                 <div className="p-6 border-b border-neutral-700/30">
//                   <div className="flex items-center gap-4">
//                     <div className="relative">
//                       <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-amber-500 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
//                         <img 
//                           src={post.author?.UserProfile?.avatar?.url} 
//                           alt={`${post.author?.firstName || ''} ${post.author?.lastName || ''}`} 
//                           className="object-cover h-full w-full"
//                           onError={(e) => {
//                             e.target.style.display = 'none';
//                             e.target.nextSibling.style.display = 'flex';
//                           }}
//                         />
//                         <div className="hidden items-center justify-center w-full h-full bg-gradient-to-br from-purple-600 to-amber-500 text-white font-semibold">
//                           {(post.author?.firstName?.[0] || 'U') + (post.author?.lastName?.[0] || '')}
//                         </div>
//                       </div>
//                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-neutral-800"></div>
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="font-bold text-white truncate">
//                         {post.author?.firstName || 'Unknown'} {post.author?.lastName || 'User'}
//                       </h3>
//                       <p className="text-sm text-neutral-400 flex items-center">
//                         <span>{formatDate(post.updatedAt)}</span>
//                         <span className="mx-2">•</span>
//                         <span className="inline-flex items-center">
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
//                           </svg>
//                           Study Post
//                         </span>
//                       </p>
//                     </div>
//                     <button className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700/50 transition-colors">
//                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
//                       </svg>
//                     </button>
//                   </div>
//                 </div>

//                 {/* Post Content */}
//                 <div className="p-6">
//                   {post.heading && (
//                     <h2 className="text-2xl font-bold mb-4 text-white bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
//                       {post.heading}
//                     </h2>
//                   )}
//                   {post.description && (
//                     <p className="text-neutral-300 mb-6 leading-relaxed bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30">
//                       {post.description}
//                     </p>
//                   )}
                  
//                   {post.files?.url && (
//                     <div className="mb-6 rounded-2xl overflow-hidden border border-neutral-700/50 shadow-lg">
//                       {post.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
//                         <img
//                           src={post.files.url}
//                           alt={post.heading || 'Study material'}
//                           className="w-full h-auto max-h-96 object-cover"
//                           loading="lazy"
//                         />
//                       ) : post.files.url.match(/\.(mp4|webm|ogg)$/) ? (
//                         <div className='relative group'>
//                           <video
//                             ref={el => {
//                               if (el) {
//                                 videoRefs.current[post._id] = el;
//                               }
//                             }}
//                             data-video-id={post._id}
//                             src={post.files.url}
//                             className="w-full h-auto max-h-96 object-contain cursor-pointer"
//                             muted
//                             loop
//                             playsInline
//                             onClick={(e) => handleVideoClick(post._id, e)}
//                             onPlay={() => handleVideoPlay(post._id)}
//                             onPause={() => handleVideoPause(post._id)}
//                             poster={post.thumbnail || ''}
//                           />
//                           <div 
//                             className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${activePost === post._id ? 'opacity-0' : 'opacity-100'}`}
//                             onClick={(e) => handleVideoClick(post._id, e)}
//                           >
//                             <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm border border-white/10 cursor-pointer">
//                               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                             </div>
//                           </div>
//                           <button 
//                             onClick={(e) => handleVideoClick(post._id, e)} 
//                             className="absolute bottom-4 left-4 bg-black/70 rounded-full px-3 py-1 text-sm text-white backdrop-blur-sm cursor-pointer"
//                           >
//                             Click to {activePost === post._id ? 'pause' : 'play'}
//                           </button>
                          
//                           {/* Volume control */}
//                           {activePost === post._id && (
//                             <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
//                               <button 
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   const video = videoRefs.current[post._id];
//                                   if (video) {
//                                     video.muted = !video.muted;
//                                   }
//                                 }}
//                                 className="text-white"
//                               >
//                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m-4.5-9.5L12 3v18l-4.5-4.5H4a1 1 0 01-1-1v-7a1 1 0 011-1h3.5z" />
//                                 </svg>
//                               </button>
//                             </div>
//                           )}
//                         </div>
//                       ) : (
//                         <div className="bg-gradient-to-br from-neutral-800 to-neutral-700 p-8 rounded-2xl text-center">
//                           <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-2xl mb-4">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                             </svg>
//                           </div>
//                           <h4 className="text-lg font-semibold text-white mb-2">Study Document</h4>
//                           <p className="text-neutral-300 mb-4">This post contains a study document</p>
//                           <a
//                             href={post.files.url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full hover:from-amber-400 hover:to-amber-500 transition-all duration-300 text-white font-medium shadow-lg hover:shadow-amber-500/30"
//                           >
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                             </svg>
//                             Download File
//                           </a>
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Post Actions */}
//                 <div className="p-6 border-t border-neutral-700/30 bg-neutral-800/20">
//                   <div className="flex items-center justify-between flex-wrap gap-4">
//                     <div className="flex items-center gap-6">
//                       <button
//                         className={`flex items-center gap-2 transition-all duration-300 ${
//                           likedPosts.has(post._id) 
//                             ? 'text-red-500 hover:text-red-400' 
//                             : 'text-neutral-400 hover:text-red-500'
//                         }`}
//                         onClick={() => handleLike(post._id)}
//                       >
//                         <div className={`p-2 rounded-full transition-all duration-300 ${likedPosts.has(post._id) ? 'bg-red-500/20' : 'bg-neutral-700/50 hover:bg-red-500/20'}`}>
//                           <svg
//                             xmlns="http://www.w3.org/2000/svg"
//                             viewBox="0 0 24 24"
//                             width="20"
//                             height="20"
//                             fill={likedPosts.has(post._id) ? "currentColor" : "none"}
//                             stroke="currentColor"
//                             strokeWidth="2"
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                           >
//                             <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
//                           </svg>
//                         </div>
//                         <span className="font-medium">
//                           {likedPosts.has(post._id) ? 'Liked' : 'Like'}
//                         </span>
//                       </button>

//                       <button className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 transition-all duration-300">
//                         <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-amber-500/20 transition-all duration-300">
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
//                           </svg>
//                         </div>
//                         <span className="font-medium">Comment</span>
//                       </button>

//                       <button className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-all duration-300">
//                         <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-purple-500/20 transition-all duration-300">
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
//                           </svg>
//                         </div>
//                         <span className="font-medium">Share</span>
//                       </button>
//                     </div>

//                     <button className="flex items-center gap-2 text-neutral-400 hover:text-emerald-400 transition-all duration-300">
//                       <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-emerald-500/20 transition-all duration-300">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
//                         </svg>
//                       </div>
//                       <span className="font-medium">Save</span>
//                       </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StudyVerseMain;








import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Lenis from "@studio-freight/lenis";
import { usePostsStore } from '../../StateManagement/StoreNotes';
import Socket from '../../SocketConnection/Socket';
import { Link } from 'react-router-dom'

const StudyVerseMain = () => {
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activePost, setActivePost] = useState(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const videoRefs = useRef({});
  const observer = useRef(null);
  const searchRef = useRef(null);
  const { posts, loading, error, fetchPosts, clearPosts } = usePostsStore();
  const [ClickedGroupBtn, setClickedGroupBtn] = useState({id : null , isOpen: false, username: null});
  const [OpenBtnGroup , setOpenBtnGroup] = useState(false);

  // Lenis smooth scrolling setup
  useEffect(() => {
    console.log("Lenis init 🚀");
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

    lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
      console.log("Lenis Scroll:", scroll, "/", limit);
      
      if (observer.current) {
        observer.current.disconnect();
        
        Object.values(videoRefs.current).forEach(video => {
          if (video) {
            observer.current.observe(video);
          }
        });
      }
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  // Scroll detection for mobile search bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide search bar
        setShowSearchBar(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        // Scrolling up or at top - show search bar
        setShowSearchBar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Socket connection for real-time updates
  useEffect(() => {
    const handler = ({ Fetch }) => {
      console.log("Fetch front", Fetch);
      if (Fetch) {
        clearPosts();
        console.log("Fetch")
        fetchPosts();
      }
    };

    Socket.on("FetchAgain", handler);

    return () => {
      Socket.off("FetchAgain", handler);
    };
  }, []);

  // Intersection Observer for video elements
  useEffect(() => {
    if (posts.length === 0) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.dataset.videoId;
          const videoElement = videoRefs.current[videoId];
          
          if (videoElement) {
            if (entry.isIntersecting) {
              setActivePost(videoId);
              videoElement.muted = true;
              videoElement.play().catch(error => {
                console.log('Autoplay prevented:', error);
              });
            } else {
              if (activePost === videoId) {
                setActivePost(null);
              }
              videoElement.pause();
            }
          }
        });
      },
      {
        threshold: 0.7,
        rootMargin: '0px 0px -15% 0px'
      }
    );

    Object.values(videoRefs.current).forEach(video => {
      if (video) {
        observer.current.observe(video);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [posts, activePost]);

  const handleLike = async (postId) => {
    try {
      const newLikedPosts = new Set(likedPosts);
      if (newLikedPosts.has(postId)) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);

      await axios.post(`${import.meta.env.VITE_API_URL}/posts/${postId}/like`);
    } catch (err) {
      console.error('Error liking post:', err);
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

  const handleVideoClick = (postId, e) => {
    e.stopPropagation();
    
    const videoElement = videoRefs.current[postId];
    console.log('Video element:', videoElement);
    console.log('Video paused state:', videoElement?.paused);
    
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.muted = false;
        videoElement.play().then(() => {
          setActivePost(postId);
          console.log('Video playing');
        }).catch(error => {
          console.log('Play failed:', error);
        });
      } else {
        videoElement.pause();
        setActivePost(null);
        console.log('Video paused');
      }
    }
  };

  const handleVideoPlay = (postId) => {
    setActivePost(postId);
  };

  const handleVideoPause = (postId) => {
    if (activePost === postId) {
      setActivePost(null);
    }
  };

  const handleOpneGroupBtn = (id , username) => {
    setClickedGroupBtn({
      id: id,
      isOpen: true,
      username: username,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center p-4">
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
            Loading study materials...
          </p>
          <p className="text-neutral-400 text-sm mt-2">Preparing your learning journey</p>
        </div>
      </div>
    );
  }

  if (error) {
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
            onClick={() => fetchPosts()} 
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-purple-500/30 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lenis min-h-screen bg-gradient-to-br from-neutral-900  to-neutral-800 text-white py-8">
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 transition-transform duration-300">
        <nav className='fixed z-30 gap-0 top-0 left-0 w-full h-15'>
          <div className='h-20 backdrop-blur-sm overflow-hidden flex items-center'>
            <img src="/LOGO/StudyVerseLogo2.png" className='h-30 object-cover' alt="" />
          </div>
        </nav>
        <div className="absolute top-20 w-full p-3">
          <div className="flex items-center"
           style={{ transform: showSearchBar ? 'translateY(0)' : 'translateY(-300%)' }}
           ref={searchRef}>
            <div className="flex-1">
              <input
                type="text" 
                className="bg-neutral-800/80 p-3 w-full rounded-2xl placeholder:text-neutral-400 text-white outline-none border border-neutral-700/50 focus:border-purple-500/50 transition-colors"
                placeholder="Search study materials..." 
              />
            </div>
            <button className="ml-2 p-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-2xl hover:from-purple-500 hover:to-amber-400 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12 md:mt-0 mt-30">
          <div className="hidden md:inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-amber-500 rounded-2xl mb-6 shadow-lg">
            <img src='/LOGO/StudyVerseIcon.png' alt="" />
          </div>
          <h1 className="text-4xl mt-5 md:mt-0 md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent mb-4">
            StudyVerse Community
          </h1>
          <p className="text-lg text-neutral-300 max-w-2xl mx-auto">
            Discover, share and collaborate on the best study materials
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Notes
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Videos
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDFs
            </span>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-neutral-800/40 rounded-3xl border border-neutral-700/30 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-700/30 rounded-3xl mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No study materials yet</h3>
            <p className="text-neutral-400 max-w-md mx-auto mb-6">
              Be the first to share your knowledge and help others learn
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500/20">
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <div 
                key={post._id} 
                className="bg-neutral-800/40 max-w-2xl mx-auto backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl hover:shadow-neutral-900/30 transition-all duration-300 border border-neutral-700/30 hover:border-neutral-600/50"
              >
                {/* Post Header */}
                <div className="p-6 border-b border-neutral-700/30 relative ">
                  <div className="flex items-center gap-4 ">
                    <div className="relative">
                        <Link to={`/profile/${post?.author?.username}`}>
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-amber-500 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg">
                              <img 
                                src={post.author?.UserProfile?.avatar?.url} 
                                alt={`${post.author?.firstName || ''} ${post.author?.lastName || ''}`} 
                                className="object-cover h-full w-full"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            <div className="hidden items-center justify-center w-full h-full bg-gradient-to-br from-purple-600 to-amber-500 text-white font-semibold">
                              {(post.author?.firstName?.[0] || 'U') + (post.author?.lastName?.[0] || '')}
                            </div>
                          </div>
                        </Link>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">
                        {post.author?.firstName || 'Unknown'} {post.author?.lastName || 'User'}
                      </h3>
                      <p className="text-sm text-neutral-400 flex items-center">
                        <span>{formatDate(post.updatedAt)}</span>
                        <span className="mx-2">•</span>
                        <span className="inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Study Post
                        </span>
                      </p>
                    </div>
                      <button onClick={() =>{ handleOpneGroupBtn(post._id, post?.author?.username); setOpenBtnGroup(!OpenBtnGroup)}} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-700/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                      </button>
                  </div>
                    <div className=''>
                      {OpenBtnGroup && ClickedGroupBtn.id === post?._id && (
                        <div className='flex flex-col absolute right-2 bg-neutral-800 rounded-xl text-center'>
                          <Link to={`/messages/${ClickedGroupBtn.username}`} className='hover:bg-neutral-700 w-full px-5 p-2 rounded-tl-xl cursor-pointer rounded-tr-xl'>Message</Link>
                          <Link to={`/profile/${ClickedGroupBtn.username}`} className='hover:bg-neutral-700 w-full px-5 p-2 cursor-pointer'>Profile</Link>
                          <Link to='#' className='hover:bg-blue-700 cursor-pointer bg-blue-600 w-full px-5 p-2 rounded-bl-xl rounded-br-xl'>Peer</Link>
                        </div>
                      )}
                    </div>
                </div>

                {/* Post Content */}
                <div className="p-6">
                  {post.heading && (
                    <h2 className="text-2xl font-bold mb-4 text-white bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
                      {post.heading}
                    </h2>
                  )}
                  {post.description && (
                    <p className="text-neutral-300 mb-6 leading-relaxed bg-neutral-800/30 rounded-xl p-4 border border-neutral-700/30">
                      {post.description}
                    </p>
                  )}
                  
                  {post.files?.url && (
                    <div className="mb-6 rounded-2xl overflow-hidden border border-neutral-700/50 shadow-lg">
                      {post.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                        <img
                          src={post.files.url}
                          alt={post.heading || 'Study material'}
                          className="w-full h-auto max-h-96 object-cover"
                          loading="lazy"
                        />
                      ) : post.files.url.match(/\.(mp4|webm|ogg)$/) ? (
                        <div className='relative group'>
                          <video
                            ref={el => {
                              if (el) {
                                videoRefs.current[post._id] = el;
                              }
                            }}
                            data-video-id={post._id}
                            src={post.files.url}
                            className="w-full h-auto max-h-96 object-contain cursor-pointer"
                            muted
                            loop
                            playsInline
                            onClick={(e) => handleVideoClick(post._id, e)}
                            onPlay={() => handleVideoPlay(post._id)}
                            onPause={() => handleVideoPause(post._id)}
                            poster={post.thumbnail || ''}
                          />
                          <div 
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${activePost === post._id ? 'opacity-0' : 'opacity-100'}`}
                            onClick={(e) => handleVideoClick(post._id, e)}
                          >
                            <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm border border-white/10 cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleVideoClick(post._id, e)} 
                            className="absolute bottom-4 left-4 bg-black/70 rounded-full px-3 py-1 text-sm text-white backdrop-blur-sm cursor-pointer"
                          >
                            Click to {activePost === post._id ? 'pause' : 'play'}
                          </button>
                          
                          {/* Volume control */}
                          {activePost === post._id && (
                            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1 backdrop-blur-sm">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const video = videoRefs.current[post._id];
                                  if (video) {
                                    video.muted = !video.muted;
                                  }
                                }}
                                className="text-white"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a9 9 0 010 12m-4.5-9.5L12 3v18l-4.5-4.5H4a1 1 0 01-1-1v-7a1 1 0 011-1h3.5z" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-neutral-800 to-neutral-700 p-8 rounded-2xl text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-2xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">Study Document</h4>
                          <p className="text-neutral-300 mb-4">This post contains a study document</p>
                          <a
                            href={post.files.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full hover:from-amber-400 hover:to-amber-500 transition-all duration-300 text-white font-medium shadow-lg hover:shadow-amber-500/30"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download File
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="p-6 border-t border-neutral-700/30 bg-neutral-800/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                      <button
                        className={`flex items-center gap-2 transition-all duration-300 ${
                          likedPosts.has(post._id) 
                            ? 'text-red-500 hover:text-red-400' 
                            : 'text-neutral-400 hover:text-red-500'
                        }`}
                        onClick={() => handleLike(post._id)}
                      >
                        <div className={`p-2 rounded-full transition-all duration-300 ${likedPosts.has(post._id) ? 'bg-red-500/20' : 'bg-neutral-700/50 hover:bg-red-500/20'}`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            fill={likedPosts.has(post._id) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                          </svg>
                        </div>
                        <span className="font-medium">
                          {likedPosts.has(post._id) ? 'Liked' : 'Like'}
                        </span>
                      </button>

                      <button className="flex items-center gap-2 text-neutral-400 hover:text-amber-400 transition-all duration-300">
                        <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-amber-500/20 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <span className="font-medium">Comment</span>
                      </button>

                      <button className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-all duration-300">
                        <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-purple-500/20 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </div>
                        <span className="font-medium">Share</span>
                      </button>
                    </div>

                    <button className="flex items-center gap-2 text-neutral-400 hover:text-emerald-400 transition-all duration-300">
                      <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-emerald-500/20 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      <span className="font-medium">Save</span>
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