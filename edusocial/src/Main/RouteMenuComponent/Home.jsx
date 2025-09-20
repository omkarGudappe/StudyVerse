import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Lenis from "@studio-freight/lenis";
import { usePostsStore } from '../../StateManagement/StoreNotes';
import Socket from '../../SocketConnection/Socket';
import { Link } from 'react-router-dom'
import { UserDataContextExport } from './CurrentUserContexProvider';
import CommentModel from './Panels/CommentModel';
import PeerButtonManage from './SmallComponents/PeerButtonManage';
import { ref, push } from "firebase/database";   // 👈 add at top
import { database } from "../../Auth/AuthProviders/FirebaseSDK"; // 👈 add at top


const StudyVerseMain = () => {
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [activePost, setActivePost] = useState(null);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const videoRefs = useRef({});
  const observer = useRef(null);
  const searchRef = useRef(null);
  const loadMoreRef = useRef(null);
  const { posts, loading, error, hasMore, fetchPosts, loadMorePosts, initialLoading } = usePostsStore();
  const [ClickedGroupBtn, setClickedGroupBtn] = useState({id : null , isOpen: false, username: null});
  const [OpenBtnGroup , setOpenBtnGroup] = useState(false);
  const { ProfileData } = UserDataContextExport();
  const [isLiked, setIsLiked] = useState({ id:null, status: false });
  const [pendingLikes, setPendingLikes] = useState(new Set());
  const [localLikedPosts, setLocalLikedPosts] = useState(new Set());
  const [OpenCommentModel, setCommentModel] = useState({ id: null, PostownerId: null, status:false });
  const [RunLoading , setRunLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState({ 
    isOpen: false, 
    post: null 
  });
  const [peersList, setPeersList] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState(null);

  // Infinite scroll observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMorePosts();
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
  }, [hasMore, loading, loadMorePosts]);

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

    lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
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
    return () => {
      // Clean up any pending requests or timeouts
      usePostsStore.getState().clearPosts();
    };
  }, []);

  const FetchPostsFromBack = () => {
    if (ProfileData?._id) {
      fetchPosts(ProfileData._id);
    } 
    // else {
    //   usePostsStore.getState().error = "Faild To Loade Posts";
    // }
  }

  useEffect(() => {
    FetchPostsFromBack()
  }, [fetchPosts, ProfileData]);

  useEffect(() => {
    const handler = ({ Fetch }) => {
      if (Fetch) {
        fetchPosts(true);
      }
    };

    Socket.on("FetchAgain", handler);

    return () => {
      Socket.off("FetchAgain", handler);
    };
  }, [fetchPosts]);

  const fetchPeersList = async () => {
    const id = ProfileData?._id;
    try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/userConnections/${id}`);
        if (res.data.ok) {
            // setConnections(res.data.ConnectionNetWork);
            // setConnectionsNetwork(res.data.Connections);
            setPeersList(res.data.Connections);
        }
    } catch (err) {
        console.log(err.message);
    }
  }


const handleShareToPeer = async (peerId) => {
  if (!shareModalOpen.post) return;

  try {
    const Id = ProfileData?._id;
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/posts/share`,
      {
        postId: shareModalOpen.post._id,
        recipientId: peerId,
        senderId: Id,
      },
    );
    
    if (response.data.success) {
      alert('Post shared successfully!');
      setShareModalOpen({ isOpen: false, post: null });

      // 👇 1. Emit socket for real-time notification
      Socket.emit("post-shared", {
        postData: shareModalOpen.post,
        recipientId: peerId,
        senderId: Id,
      });

      // 👇 2. Save the shared post as a message in Firebase
      const chatId = Id > peerId ? `${Id}_${peerId}` : `${peerId}_${Id}`;
      const messageData = {
        senderId: Id,
        text: "", // optional
        sharedPost: shareModalOpen.post, // 👈 attach the full post object
        timestamp: Date.now()
      };

      const messagesRef = ref(database, `chats/${chatId}/messages`);
      await push(messagesRef, messageData);
    }
  } catch (error) {
    console.error("Error sharing post:", error);
    alert('Failed to share post');
  }
};


// Remove the sharePostInChat function as it's not needed

  const handleSharePost = (post) => {
    setShareModalOpen({ isOpen: true, post });
    fetchPeersList();
  };

  useEffect(() => {
    const handler = ({ postId, likes, liked }) => {
      setPendingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });

      usePostsStore.getState().updatePostLikes(postId, likes);
      
      if (liked) {
        setLocalLikedPosts(prev => new Set([...prev, postId]));
      } else {
        setLocalLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    };

    Socket.on("post-like-updated", handler);

    return () => {
      Socket.off("post-like-updated", handler);
    };
  }, []);

  useEffect(() => {
    if (posts.length > 0 && ProfileData?._id) {
      const userLikedPosts = new Set();
      posts.forEach(post => {
        if (VerifyLikeServer(post._id, post?.likes)) {
          userLikedPosts.add(post._id);
        }
      });
      setLocalLikedPosts(userLikedPosts);
    }
  }, [posts, ProfileData]);

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

  const handleLike = async (postId, postAuthorId) => {
    try {
      const UserId = ProfileData?._id;
      if (!UserId) return;
      
      const isCurrentlyLiked = localLikedPosts.has(postId);
      
      if (isCurrentlyLiked) {
        setLocalLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        setLocalLikedPosts(prev => new Set([...prev, postId]));
      }
      
      setPendingLikes(prev => new Set([...prev, postId]));
      
      Socket.emit("Handle-user-like", { postId, userId: UserId, type: "like" , toId: postAuthorId  });
      
    } catch (err) {
      console.log(err.message);
      setLocalLikedPosts(new Set(localLikedPosts));
      setPendingLikes(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
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
    
    if (videoElement) {
      if (videoElement.paused) {
        videoElement.muted = false;
        videoElement.play().then(() => {
          setActivePost(postId);
        }).catch(error => {
        });
      } else {
        videoElement.pause();
        setActivePost(null);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setRunLoading(false);
    }, 4000)
    setRunLoading(true);
  } , [initialLoading])

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

  const VerifyLikeServer = (postId, likes) => {
    const userId = ProfileData?._id;
    if (!userId) return false;
    
    return likes.some(like => 
      typeof like === 'object' ? like._id === userId : like === userId
    );
  };

  const VerifyLike = (postId, likes) => {
    return localLikedPosts.has(postId);
  };

  const isLikePending = (postId) => {
    return pendingLikes.has(postId);
  };

  const Loading = () => {
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
    )
  }

  if (loading && posts.length === 0) {
    return <Loading/>
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
            onClick={() => {fetchPosts(ProfileData._id)}} 
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

        { initialLoading ? (
          <Loading/>
        ) : posts.length === 0 ? (
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
                        <Link to={ProfileData?._id === post?.author?._id ? `/profile` : `/profile/${post?.author?.username}`}>
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
                          <Link to={ProfileData?._id === post?.author?._id ? `/profile` : `/profile/${post?.author?.username}`} className='hover:bg-neutral-700 w-full px-5 p-2 cursor-pointer'>Profile</Link>
                          <div className=''>
                            <PeerButtonManage className='rounded-bl-xl rounded-br-xl w-full' currentUser={ProfileData?._id} OtherUser={post?.author?._id} />
                          </div>
                        </div>
                      )}
                    </div>
                </div>

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

                <div className="p-6 border-t border-neutral-700/30 bg-neutral-800/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                     <button
                        className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${
                          VerifyLike(post._id, post?.likes)
                            ? 'text-red-500 hover:text-red-400' 
                            : 'text-neutral-400 hover:text-red-500'
                        } ${isLikePending(post._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !isLikePending(post?._id) && handleLike(post?._id, post?.author?._id)}
                        disabled={isLikePending(post._id)}
                      >
                        <div className={`p-2 rounded-full transition-all duration-300 ${
                          VerifyLike(post._id, post?.likes) 
                            ? 'bg-red-500/20' 
                            : 'bg-neutral-700/50 hover:bg-red-500/20'
                        }`}>
                          {isLikePending(post._id) ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="20"
                              height="20"
                              fill={VerifyLike(post._id, post?.likes) ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-neutral-400">
                          {post.likes?.length || 0}
                        </span>
                      </button>

                      <button onClick={() => setCommentModel({id: post?._id, PostownerId: post?.author?._id ,status: true})} className="cursor-pointer flex items-center gap-2 text-neutral-400 hover:text-amber-400 transition-all duration-300">
                        <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-amber-500/20 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleSharePost(post)}
                        className="flex items-center gap-2 text-neutral-400 hover:text-purple-400 transition-all duration-300"
                      >
                        <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-purple-500/20 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </div>
                      </button>
                    </div>

                    <button className="flex items-center gap-2 text-neutral-400 hover:text-emerald-400 transition-all duration-300">
                      <div className="p-2 rounded-full bg-neutral-700/50 hover:bg-emerald-500/20 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                      </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Load More Trigger */}
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {loading && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-neutral-400">Loading more posts...</span>
                </div>
              )}
              
              {!hasMore && posts.length > 0 && (
                <div className="text-center text-neutral-400 py-4">
                  <p>You've reached the end! 🎉</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {OpenCommentModel.status && <CommentModel open={OpenCommentModel.status} PostownerId={OpenCommentModel.PostownerId} CommentId={OpenCommentModel.id} onClose={() => setCommentModel({id:null, PostownerId: null, status:false})} />}

      {shareModalOpen.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Share Post</h3>
              <button 
                onClick={() => setShareModalOpen({ isOpen: false, post: null })}
                className="text-neutral-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-neutral-300">Select a peer to share with:</p>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {peersList.map(peer => (
                <div 
                  key={peer._id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-700 cursor-pointer"
                  onClick={() => handleShareToPeer(peer._id)}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center overflow-hidden">
                    {peer.UserProfile?.avatar?.url ? (
                      <img 
                        src={peer.UserProfile.avatar.url} 
                        alt={`${peer.firstName} ${peer.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold">
                        {peer.firstName?.[0]}{peer.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{peer.firstName} {peer.lastName}</p>
                    <p className="text-neutral-400 text-sm">{peer.username}</p>
                  </div>
                </div>
              ))}
              
              {peersList.length === 0 && (
                <p className="text-neutral-400 text-center py-4">No peers found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyVerseMain;