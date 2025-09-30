import React, { useState, useEffect, useRef, useCallback } from "react";

import axios from "axios";

import Lenis from "@studio-freight/lenis";

import { usePostsStore } from "../../StateManagement/StoreNotes";

import Socket from "../../SocketConnection/Socket";

import { Link } from "react-router-dom";

import { UserDataContextExport } from "./CurrentUserContexProvider";

import CommentModel from "./Panels/CommentModel";

import PeerButtonManage from "./SmallComponents/PeerButtonManage";

import { ref, push } from "firebase/database";

import { database } from "../../Auth/AuthProviders/FirebaseSDK";

import "react-pdf/dist/Page/AnnotationLayer.css";

import "react-pdf/dist/Page/TextLayer.css";

import RawToPdfConverter from "./Panels/RawToPdfConverter";

import LikeComponent from "./SmallComponents/LikeComponent";

import { pdfjs } from "react-pdf";

import * as PdfJs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",

  import.meta.url
).toString();

const StudyVerseMain = () => {
  const [likedPosts, setLikedPosts] = useState(new Set());

  const [activePost, setActivePost] = useState(null);

  const [showSearchBar, setShowSearchBar] = useState(true);

  const [lastScrollY, setLastScrollY] = useState(0);

  const videoRefs = useRef({});

  const observer = useRef(null);

  const searchRef = useRef(null);

  const loadMoreRef = useRef(null);

  const {
    posts,
    loading,
    error,
    hasMore,
    fetchPosts,
    loadMorePosts,
    initialLoading,
  } = usePostsStore();

  const [ClickedGroupBtn, setClickedGroupBtn] = useState({
    id: null,
    isOpen: false,
    username: null,
  });

  const [OpenBtnGroup, setOpenBtnGroup] = useState(false);

  const { ProfileData } = UserDataContextExport();

  const [isLiked, setIsLiked] = useState({ id: null, status: false });

  const [pendingLikes, setPendingLikes] = useState(new Set());

  const [localLikedPosts, setLocalLikedPosts] = useState(new Set());

  const [OpenCommentModel, setCommentModel] = useState({
    id: null,
    PostownerId: null,
    status: false,
  });

  const [RunLoading, setRunLoading] = useState(false);

  const [shareModalOpen, setShareModalOpen] = useState({
    isOpen: false,

    post: null,
  });

  const [peersList, setPeersList] = useState([]);

  const [selectedPeer, setSelectedPeer] = useState(null);

  const [pdfModal, setPdfModal] = useState({
    isOpen: false,
    url: null,
    numPages: 0,
    pageNumber: 1,
  });

  const [IsChatActive, setIsChatActive] = useState("Chat");

  const [pdfLoading, setPdfLoading] = useState(false);

  const [contacts, setContacts] = useState([]);

  const [groups, setGroups] = useState([]);

  const [selectedMembers, setSelectedMembers] = useState([]);

  const [rawContentModal, setRawContentModal] = useState({
    isOpen: false,

    content: null,

    type: null,

    fileName: null,

    convertedPdfUrl: null,
  });

  useEffect(() => {
    if (!hasMore || loading) return;

    const options = {
      root: null,

      rootMargin: "100px",

      threshold: 0.1,
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMorePosts(ProfileData?._id);
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
  }, [hasMore, loading, ProfileData?._id]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,

      smoothWheel: true,

      smoothTouch: true,

      touchMultiplier: 1.5,

      wheelMultiplier: 1.2,

      gestureOrientation: "vertical",
    });

    function raf(time) {
      lenis.raf(time);

      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
      if (observer.current) {
        observer.current.disconnect();

        Object.values(videoRefs.current).forEach((video) => {
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

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    const fetchData = async () => {
      if (ProfileData?._id) {
        await usePostsStore.getState().refreshIfNeeded(ProfileData._id);
      }
    };

    fetchData();
  }, [ProfileData?._id]);

  const FetchPostsFromBack = () => {
    if (ProfileData?._id) {
      fetchPosts(ProfileData._id);
    }
  };

  useEffect(() => {
    Socket.on("ContactUsers", (data) => {
      if (!data) return;
      setContacts(data.User || []);
      setGroups(data.Groups || []);
    });

    return () => {
      Socket.off("ContactUsers");
    };
  }, []);

  useEffect(() => {
    FetchPostsFromBack();
  }, [fetchPosts, ProfileData]);

  useEffect(() => {
    const handler = ({ Fetch }) => {
      if (Fetch) {
        usePostsStore.getState().refreshIfNeeded(ProfileData._id);
      }
    };

    Socket.on("FetchAgain", handler);

    return () => {
      Socket.off("FetchAgain", handler);
    };
  }, [ProfileData?._id]);

  // useEffect(() => {

  //   const handler = ({ Fetch }) => {

  //     if (Fetch) {

  //       fetchPosts(ProfileData._id, false, true);

  //     }

  //   };

  //   Socket.on("FetchAgain", handler);

  //   return () => {

  //     Socket.off("FetchAgain", handler);

  //   };

  // }, [fetchPosts, ProfileData]);

  const fetchPeersList = async () => {
    const id = ProfileData?._id;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/userConnections/${id}`
      );

      if (res.data.ok) {
        setPeersList(res.data.Connections);
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleShareToPeer = async (recipientID, isGroup, path) => {
    if (!shareModalOpen.post) return;

    try {
      const Id = ProfileData?._id;

      console.log("Path", path, "and", isGroup, "and", recipientID);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/posts/share`,

        {
          postId: shareModalOpen.post._id,

          recipientId: recipientID,

          senderId: Id,
        }
      );

      if (response.data.success) {
        alert("Post shared successfully!");

        setShareModalOpen({ isOpen: false, post: null });

        Socket.emit("post-shared", {
          postData: shareModalOpen.post,

          recipientId: recipientID,

          senderId: Id,
        });

        if (isGroup) {
          const messsageData = {
            senderId: Id,

            text: "",

            sharedPost: shareModalOpen.post,

            timestamp: Date.now(),
          };

          const messagesRef = ref(database, path);

          await push(messagesRef, messsageData);
        } else {
          const chatId =
            Id > recipientID ? `${Id}_${recipientID}` : `${recipientID}_${Id}`;

          const messageData = {
            senderId: Id,

            text: "",

            sharedPost: shareModalOpen.post,

            timestamp: Date.now(),
          };

          const messagesRef = ref(database, `chats/${chatId}/messages`);

          await push(messagesRef, messageData);
        }
      }
    } catch (error) {
      console.error("Error sharing post:", error);

      alert("Failed to share post");
    }
  };

  const handleSharePost = (post) => {
    setShareModalOpen({ isOpen: true, post });
    Socket.emit("SendContactUsers", { ID: ProfileData?._id })
    fetchPeersList();
  };

  useEffect(() => {
    const handler = ({ postId, likes, liked }) => {
      setPendingLikes((prev) => {
        const newSet = new Set(prev);

        newSet.delete(postId);

        return newSet;
      });

      usePostsStore.getState().updatePostLikes(postId, likes);

      if (liked) {
        setLocalLikedPosts((prev) => new Set([...prev, postId]));
      } else {
        setLocalLikedPosts((prev) => {
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

  // Add this function to your component

  // Improved file type detection

  const getFileType = (url) => {
    if (!url) return "unknown";

    const lowerUrl = url.toLowerCase();

    // Always check extension first

    if (lowerUrl.endsWith(".pdf")) return "pdf";

    if (
      lowerUrl.endsWith(".mp4") ||
      lowerUrl.endsWith(".webm") ||
      lowerUrl.endsWith(".mov")
    )
      return "video";

    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";

    if (lowerUrl.endsWith(".txt") || lowerUrl.endsWith(".text")) return "text";

    // For Cloudinary raw uploads with PDF in URL, treat as PDF

    if (url.includes("/raw/upload/") && url.includes(".pdf")) return "pdf";

    // For other raw uploads, treat as text

    if (url.includes("/raw/upload/")) return "text";

    return "unknown";
  };

  // useEffect(() => {
  //   if (posts.length > 0 && ProfileData?._id) {
  //     const userLikedPosts = new Set();

  //     posts.forEach((post) => {
  //       if (VerifyLikeServer(post._id, post?.likes)) {
  //         userLikedPosts.add(post._id);
  //       }
  //     });

  //     setLocalLikedPosts(userLikedPosts);
  //   }
  // }, [posts, ProfileData]);

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

              videoElement.play().catch((error) => {});
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

        rootMargin: "0px 0px -15% 0px",
      }
    );

    Object.values(videoRefs.current).forEach((video) => {
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
        setLocalLikedPosts((prev) => {
          const newSet = new Set(prev);

          newSet.delete(postId);

          return newSet;
        });
      } else {
        setLocalLikedPosts((prev) => new Set([...prev, postId]));
      }

      setPendingLikes((prev) => new Set([...prev, postId]));

      Socket.emit("Handle-user-like", {
        postId,
        userId: UserId,
        type: "like",
        toId: postAuthorId,
      });
    } catch (err) {
      console.log(err.message);

      setLocalLikedPosts(new Set(localLikedPosts));

      setPendingLikes((prev) => {
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

    if (diffMinutes < 1) return "Just now";

    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    if (diffHours < 24) return `${diffHours}h ago`;

    if (diffDays === 1) return "Yesterday";

    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",

      day: "numeric",

      year: diffDays > 365 ? "numeric" : undefined,
    });
  };

  const UserCard = ({
    user,
    isGroup = false,
    onClick,
    showCheckbox = false,
    isSelected = false,
  }) => {
    const displayName = isGroup
      ? user.name
      : `${user?.User2?.firstName} ${user?.User2?.lastName}`;

    const username = isGroup
      ? `${user?.members?.length || 0} members`
      : user?.User2?.username;

    const subtitle = isGroup
      ? `Created by ${user.createdBy?.firstName} ${user.createdBy?.lastName}`
      : user.education
      ? user.education.standard || user.education.degree
      : "";

    const avatarContent = isGroup ? (
      <span className="text-white font-semibold text-lg">
        {user.name?.[0]}
        {user.name?.[1] || ""}
      </span>
    ) : user?.User2?.UserProfile?.avatar?.url ? (
      <img
        src={user?.User2?.UserProfile?.avatar?.url}
        alt={displayName}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-white font-semibold text-lg">
        {user?.User2?.firstName?.[0]}
        {user?.User2?.lastName?.[0]}
      </span>
    );

    return (
      <div
        className={`cursor-pointer flex items-center gap-4 w-full  p-4 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-all duration-200 group ${
          showCheckbox ? "pr-3" : ""
        }`}
        onClick={onClick}
      >
        {showCheckbox && (
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected
                ? "bg-purple-500 border-purple-500"
                : "border-neutral-500"
            }`}
            onClick={(e) => {
              e.stopPropagation();

              onClick();
            }}
          >
            {isSelected && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        )}

        <div className="relative flex-shrink-0">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-neutral-700 group-hover:border-purple-500 transition-colors ${
              isGroup
                ? "bg-gradient-to-br from-purple-600 to-indigo-600"
                : "bg-gradient-to-br from-purple-600 to-amber-600"
            }`}
          >
            {avatarContent}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{displayName}</h3>

          <p className="text-neutral-400 text-sm truncate">{username}</p>

          {subtitle && (
            <p className="text-neutral-500 text-xs mt-1 truncate">{subtitle}</p>
          )}
        </div>

        {!showCheckbox && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const handleVideoClick = (postId, e) => {
    e.stopPropagation();

    const videoElement = videoRefs.current[postId];

    if (videoElement) {
      if (videoElement.paused) {
        videoElement.muted = false;

        videoElement
          .play()
          .then(() => {
            setActivePost(postId);
          })
          .catch((error) => {});
      } else {
        videoElement.pause();

        setActivePost(null);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setRunLoading(false);
    }, 4000);

    setRunLoading(true);
  }, [initialLoading]);

  const handleVideoPlay = (postId) => {
    setActivePost(postId);
  };

  const handleVideoPause = (postId) => {
    if (activePost === postId) {
      setActivePost(null);
    }
  };

  const handleOpneGroupBtn = (id, username) => {
    setClickedGroupBtn({
      id: id,

      isOpen: true,

      username: username,
    });
  };

  const VerifyLikeServer = (postId, likes) => {
    const userId = ProfileData?._id;

    if (!userId) return false;

    return likes.some((like) =>
      typeof like === "object" ? like._id === userId : like === userId
    );
  };

  const toggleMemberSelection = (user) => {
    if (selectedMembers.some((member) => member._id === user._id)) {
      setSelectedMembers(
        selectedMembers.filter((member) => member._id !== user._id)
      );
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const VerifyLike = (postId, likes) => {
    return localLikedPosts.has(postId);
  };

  const togglePeerSelection = (peer) => {
    if (selectedPeer?._id === peer._id) {
      setSelectedPeer(null);
    } else {
      setSelectedPeer(peer);
    }
  };

  const isLikePending = (postId) => {
    return pendingLikes.has(postId);
  };

  const openPdfModal = (url) => {
    setPdfModal({ isOpen: true, url, numPages: 0, pageNumber: 1 });

    setPdfLoading(true);
  };

  const closePdfModal = () => {
    setPdfModal({ isOpen: false, url: null, numPages: 0, pageNumber: 1 });
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setPdfModal((prev) => ({ ...prev, numPages }));

    setPdfLoading(false);
  };

  const changePage = (offset) => {
    setPdfModal((prev) => ({
      ...prev,

      pageNumber: Math.min(
        Math.max(prev.pageNumber + offset, 1),
        prev.numPages
      ),
    }));
  };

  const previousPage = () => {
    changePage(-1);
  };

  const nextPage = () => {
    changePage(1);
  };

  const handleRawContent = (content, type, fileName) => {
    setRawContentModal({
      isOpen: true,

      content,

      type: "text", // Force text type for URL content

      fileName,

      convertedPdfUrl: null,
    });
  };

  const handleConversionComplete = (pdfUrl) => {
    setRawContentModal((prev) => ({ ...prev, convertedPdfUrl: pdfUrl }));

    // Also update the PDF modal to show the converted PDF

    setPdfModal({
      isOpen: true,

      url: pdfUrl,

      numPages: 0,

      pageNumber: 1,
    });
  };

  const closeRawContentModal = () => {
    setRawContentModal({
      isOpen: false,
      content: null,
      type: null,
      fileName: null,
      convertedPdfUrl: null,
    });
  };

  const PostSkeleton = () => {
    return (
      <div className="bg-neutral-800/40 lg:w-2xl backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border border-neutral-700/30">
        <div className="p-5 border-b border-neutral-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-700 rounded-xl animate-pulse"></div>

            <div className="flex-1 min-w-0">
              <div className="h-4 bg-neutral-700 rounded w-1/3 mb-2 animate-pulse"></div>

              <div className="h-3 bg-neutral-700 rounded w-1/4 animate-pulse"></div>
            </div>

            <div className="w-6 h-6 bg-neutral-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        <div className="p-5">
          <div className="h-5 bg-neutral-700 rounded w-3/4 mb-3 animate-pulse"></div>

          <div className="space-y-2 mb-4">
            <div className="h-3 bg-neutral-700 rounded w-full animate-pulse"></div>

            <div className="h-3 bg-neutral-700 rounded w-2/3 animate-pulse"></div>
          </div>

          <div className="aspect-video bg-neutral-700 rounded-xl animate-pulse mb-4"></div>
        </div>

        <div className="p-4 border-t border-neutral-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <div className="w-8 h-8 bg-neutral-700 rounded-lg animate-pulse"></div>

                <div className="w-6 h-4 bg-neutral-700 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center space-x-1.5">
                <div className="w-8 h-8 bg-neutral-700 rounded-lg animate-pulse"></div>

                <div className="w-6 h-4 bg-neutral-700 rounded animate-pulse"></div>
              </div>

              <div className="flex items-center space-x-1.5">
                <div className="w-8 h-8 bg-neutral-700 rounded-lg animate-pulse"></div>

                <div className="w-10 h-4 bg-neutral-700 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="w-6 h-6 bg-neutral-700 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  };

  const LoadingSkeleton = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mt-0 mt-30">
            <div className="hidden md:inline-flex items-center justify-center w-24 h-24 bg-neutral-700 rounded-3xl mb-6 animate-pulse"></div>

            <div className="h-12 bg-neutral-700 rounded-2xl w-3/4 mx-auto mb-4 animate-pulse"></div>

            <div className="h-6 bg-neutral-700 rounded w-1/2 mx-auto mb-8 animate-pulse"></div>

            <div className="flex justify-center space-x-4 flex-wrap gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-8 bg-neutral-700 rounded-full w-20 animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          <div className="space-y-6 flex flex-col items-center justify-center">
            {[1, 2, 3].map((item) => (
              <PostSkeleton key={item} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading && posts.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 text-white flex items-center justify-center p-4">
        <div className="text-center p-8 bg-neutral-800/70 backdrop-blur-sm rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-white">
            Oops! Something went wrong
          </h2>

          <p className="text-neutral-300 mb-6">{error}</p>

          <button
            onClick={() => {
              fetchPosts(ProfileData._id);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-purple-500/30 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lenis select-none min-h-screen bg-gradient-to-br from-neutral-900  to-neutral-800 text-white py-8">
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 transition-transform duration-300">
        <nav className="fixed z-30 gap-0 top-0 left-0 w-full h-15">
          <div className="h-20 backdrop-blur-sm overflow-hidden flex items-center">
            <img
              src="/LOGO/StudyVerseLogo2.png"
              className="h-30 object-cover"
              alt=""
            />
          </div>
        </nav>

        <div className="absolute top-20 w-full p-3">
          <div
            className="flex items-center"
            style={{
              transform: showSearchBar ? "translateY(0)" : "translateY(-300%)",
            }}
            ref={searchRef}
          >
            <div className="flex-1">
              <input
                type="text"
                className="bg-neutral-800/80 p-3 w-full rounded-2xl placeholder:text-neutral-400 text-white outline-none border border-neutral-700/50 focus:border-purple-500/50 transition-colors"
                placeholder="Search study materials..."
              />
            </div>

            <button className="ml-2 p-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-2xl hover:from-purple-500 hover:to-amber-400 transition-all duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mt-0 mt-30">
          <div className="hidden md:inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-600 to-amber-500 rounded-3xl mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
            <img
              src="/LOGO/StudyVerseIcon.png"
              alt="StudyVerse Logo"
              className="w-14 h-14"
            />
          </div>

          <h1 className="text-4xl mt-5 md:mt-0 md:text-6xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent mb-4">
            StudyVerse Community
          </h1>

          <p className="text-xl text-neutral-300 max-w-3xl mx-auto mb-8">
            Discover, share and collaborate on the best study materials from
            students worldwide
          </p>

          <div className="mt-8 flex justify-center space-x-4 flex-wrap gap-3">
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Notes
            </span>

            <span className="inline-flex items-center px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 text-sm border border-amber-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Videos
            </span>

            <span className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              PDFs
            </span>
          </div>
        </div>

        {initialLoading ? (
          <LoadingSkeleton />
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-neutral-800/40 rounded-3xl border border-neutral-700/30 backdrop-blur-sm">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-neutral-700/30 rounded-3xl mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-neutral-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-semibold text-white mb-3">
              No study materials yet
            </h3>

            <p className="text-neutral-400 max-w-md mx-auto mb-6">
              Be the first to share your knowledge and help others learn
            </p>

            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full hover:from-purple-500 hover:to-amber-400 transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500/20">
              Create First Post
            </button>
          </div>
        ) : (
          <div className="space-y-6 flex flex-col items-center justify-center">
            {" "}
            {posts.map((post) => (
              <div
                key={post._id}
                className="bg-neutral-800/40 lg:w-2xl w-full backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl hover:shadow-neutral-900/30 transition-all duration-300 border border-neutral-700/30 hover:border-neutral-600/50"
              >
                {/* Post Header */}

                <div className="p-5 border-b border-neutral-700/30 relative">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Link
                        to={
                          ProfileData?._id === post?.author?._id
                            ? `/profile`
                            : `/profile/${post?.author?.username}`
                        }
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-amber-500 rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                          <img
                            src={post.author?.UserProfile?.avatar?.url}
                            alt={`${post.author?.firstName || ""} ${
                              post.author?.lastName || ""
                            }`}
                            className="object-cover h-full w-full"
                            onError={(e) => {
                              e.target.style.display = "none";

                              e.target.nextSibling.style.display = "flex";
                            }}
                          />

                          <div className="hidden items-center justify-center w-full h-full bg-gradient-to-br from-purple-600 to-amber-500 text-white font-semibold text-sm">
                            {(post.author?.firstName?.[0] || "U") +
                              (post.author?.lastName?.[0] || "")}
                          </div>
                        </div>
                      </Link>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate text-sm">
                        {post.author?.firstName || "Unknown"}{" "}
                        {post.author?.lastName || "User"}
                      </h3>

                      <p className="text-xs text-neutral-400 flex items-center">
                        <span>{formatDate(post.updatedAt)}</span>

                        <span className="mx-1">•</span>

                        <span className="inline-flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 mr-1 text-amber-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Study Post
                        </span>
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        handleOpneGroupBtn(post._id, post?.author?.username);
                        setOpenBtnGroup(!OpenBtnGroup);
                      }}
                      className="p-1.5 text-neutral-400 cursor-pointer hover:text-white rounded-lg hover:bg-neutral-700/50 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="">
                    {OpenBtnGroup && ClickedGroupBtn.id === post?._id && (
                      <div className="flex flex-col absolute right-2 top-14 bg-neutral-800 rounded-xl text-center z-10 shadow-lg border border-neutral-700/50">
                        <Link
                          to={`/messages/${ClickedGroupBtn.username}`}
                          className="hover:bg-neutral-700 w-full px-4 py-2 rounded-tl-xl cursor-pointer rounded-tr-xl text-sm"
                        >
                          Message
                        </Link>

                        <Link
                          to={
                            ProfileData?._id === post?.author?._id
                              ? `/profile`
                              : `/profile/${post?.author?.username}`
                          }
                          className="hover:bg-neutral-700 w-full px-4 py-2 cursor-pointer text-sm"
                        >
                          Profile
                        </Link>

                        <div className="">
                          {ProfileData?._id === post?.author?._id ? null : (
                            <PeerButtonManage
                              className="rounded-bl-xl rounded-br-xl w-full"
                              currentUser={ProfileData?._id}
                              OtherUser={post?.author?._id}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="">
                  <div className="p-5">
                    {post.heading && (
                    <h2 className="text-lg font-bold mb-3 text-white line-clamp-2">
                      {post.heading}
                    </h2>
                  )}

                  {post.description && (
                    <p className="text-neutral-300 mb-4 overflow-y-auto leading-relaxed text-sm bg-neutral-800/30 rounded-xl p-3 border border-neutral-700/30 line-clamp-3">
                      {post?.description}
                    </p>
                  )}
                  </div>

                  {post.files?.url ? (
                    <div className="mb-4 max-h-80 h-80 overflow-hidden border border-neutral-700/30">
                      {post.files?.url.endsWith(".mp4") ||
                      post.files?.url.endsWith(".webm") ||
                      post.files?.url.endsWith(".mov") ? (

                        <div className="relative aspect-video bg-black">
                          <video
                            ref={(el) => (videoRefs.current[post._id] = el)}
                            data-video-id={post._id}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={(e) => handleVideoClick(post._id, e)}
                            onPlay={() => handleVideoPlay(post._id)}
                            onPause={() => handleVideoPause(post._id)}
                            muted
                            loop
                            playsInline
                          >
                            <source src={post.files.url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>

                          {activePost !== post._id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <button className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                  />

                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : post.files?.url.endsWith(".pdf") ||
                        (post.files?.url.includes("/raw/upload/") &&
                          post.files?.url.endsWith(".pdf")) ? (
                        // PDF handling - both direct PDFs and raw uploaded PDFs

                        <div
                          className="relative group cursor-pointer h-full"
                          onClick={() => openPdfModal(post.files.url)}
                        >
                          <div className="aspect-video bg-gradient-to-br h-full w-full from-purple-600/20 to-amber-500/20 flex items-center justify-center">
                            <div className="text-center p-6">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-2xl mb-4 border border-purple-500/30">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-8 w-8 text-purple-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>

                              <h4 className="font-semibold text-white mb-2">
                                PDF Document
                              </h4>

                              <p className="text-sm text-neutral-400">
                                Click to view this study material
                              </p>
                            </div>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity  flex items-end justify-center p-4">
                            <span className="text-white text-sm font-medium bg-purple-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                              View PDF
                            </span>
                          </div>
                        </div>
                      ) : post.files?.url.includes("/raw/upload/") &&
                        !post.files?.url.endsWith(".pdf") &&
                        !post.files?.url.match(
                          /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)$/i
                        ) ? (
                        // Text file handling - only if it's raw upload AND not any other known file type

                        <div
                          className="relative group h-full cursor-pointer"
                          onClick={() =>
                            handleRawContent(
                              post.files.url,
                              "text",
                              post.heading || "Study Material"
                            )
                          }
                        >
                          <div className="aspect-video bg-gradient-to-br from-green-600/20 h-full w-full to-blue-500/20 flex items-center justify-center">
                            <div className="text-center p-6">
                              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-2xl mb-4 border border-green-500/30">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-8 w-8 text-green-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>

                              <h4 className="font-semibold text-white mb-2">
                                Text Document
                              </h4>

                              <p className="text-sm text-neutral-400">
                                Click to view this text content
                              </p>
                            </div>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                            <span className="text-white text-sm font-medium rounded-2xl bg-green-600/80 backdrop-blur-sm px-3 py-1.5">
                              View Text
                            </span>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={post.files.url}
                          alt={post.heading || "Study material"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallbackDiv = e.target.nextSibling;
                            if (
                              fallbackDiv &&
                              fallbackDiv.classList.contains("fallback-text")
                            ) {
                              fallbackDiv.style.display = "flex";
                            }
                          }}
                        />

                        // <div

                        //   className="fallback-text hidden aspect-video bg-gradient-to-br from-green-600/20 to-blue-500/20 flex items-center justify-center rounded-xl border-2 border-dashed border-green-500/30 cursor-pointer"

                        //   onClick={() => handleRawContent(post.files.url, 'text', post.heading || 'Study Material')}

                        // >

                        //   <div className="text-center p-6">

                        //     <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-2xl mb-4 border border-green-500/30">

                        //       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                        //         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                        //       </svg>

                        //     </div>

                        //     <h4 className="font-semibold text-white mb-2">Text Content</h4>

                        //     <p className="text-sm text-neutral-400">Click to view this content</p>

                        //   </div>

                        // </div>
                      )}
                    </div>
                  ) : post.rawContent ? (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() =>
                        handleRawContent(
                          post.rawContent,
                          post.contentType,
                          post.heading || "Study Material"
                        )
                      }
                    >
                      <div className="aspect-video bg-gradient-to-br from-amber-600/20 to-emerald-500/20 flex items-center justify-center rounded-xl border-2 border-dashed border-amber-500/30">
                        <div className="text-center p-6">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600/20 rounded-2xl mb-4 border border-amber-500/30">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-amber-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>

                          <h4 className="font-semibold text-white mb-2">
                            Text Content
                          </h4>

                          <p className="text-sm text-neutral-400">
                            Click to view this study material
                          </p>
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-end justify-center p-4">
                        <span className="text-white text-sm font-medium bg-amber-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          View Content
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Post Actions */}

                <div className="p-4 border-t border-neutral-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* <button 

                        onClick={() => handleLike(post._id, post.author?._id)}

                        disabled={isLikePending(post._id)}

                        className="flex items-center space-x-1.5 text-sm transition-all duration-300 hover:scale-105"

                      >

                        <div className={`p-1.5 rounded-lg transition-colors ${VerifyLike(post._id) ? 'bg-red-500/20 text-red-400' : 'hover:bg-neutral-700/50 text-neutral-400'}`}>

                          {isLikePending(post._id) ? (

                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />

                            </svg>

                          ) : VerifyLike(post._id) ? (

                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">

                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />

                            </svg>

                          ) : (

                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />

                            </svg>

                          )}

                        </div>

                        <span className={`font-medium ${VerifyLike(post._id) ? 'text-red-400' : 'text-neutral-400'}`}>

                          {post.likes?.length || 0}

                        </span>

                      </button> */}

                      <LikeComponent
                        PostId={post._id}
                        PostAuthorId={post.author?._id}
                        LikeLength={post.likes?.length}
                        CurrentUserId={ProfileData?._id}
                      />

                      <button
                        onClick={() =>
                          setCommentModel({
                            id: post._id,
                            PostownerId: post.author?._id,
                            status: true,
                          })
                        }
                        className="flex items-center space-x-1.5 text-sm text-neutral-400 hover:text-white transition-all duration-300 hover:scale-105"
                      >
                        <div className="p-1.5 rounded-lg hover:bg-neutral-700/50">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>

                        <span className="font-medium">
                          {post.comments?.length || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => handleSharePost(post)}
                        className="flex items-center space-x-1.5 text-sm text-neutral-400 hover:text-white transition-all duration-300 hover:scale-105"
                      >
                        <div className="p-1.5 rounded-lg hover:bg-neutral-700/50">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                        </div>

                        <span className="font-medium">Share</span>
                      </button>
                    </div>

                    <button className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-neutral-700/50">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Load More Ref */}
            <div
              ref={loadMoreRef}
              className="h-10 flex items-center justify-center"
            >
              {loading && hasMore && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>

                  <span className="ml-3 text-neutral-400">
                    Loading more posts...
                  </span>
                </div>
              )}
            </div>
            {/* End of content message */}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600/20 to-amber-500/20 rounded-2xl mb-4 border border-purple-500/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  You're all caught up!
                </h3>

                <p className="text-neutral-400">
                  You've seen all the latest study materials
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {shareModalOpen.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-800/90 backdrop-blur-lg rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-neutral-700/50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Share Post</h3>

                <button
                  onClick={() =>
                    setShareModalOpen({ isOpen: false, post: null })
                  }
                  className="p-2 hover:bg-neutral-700/50 rounded-lg transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex space-x-2 mb-6">
                <button
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    IsChatActive === "Chat"
                      ? "bg-purple-500 text-white"
                      : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50"
                  }`}
                  onClick={() => setIsChatActive("Chat")}
                >
                  Chats
                </button>

                <button
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    IsChatActive === "Group"
                      ? "bg-purple-500 text-white"
                      : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50"
                  }`}
                  onClick={() => setIsChatActive("Group")}
                >
                  Groups
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {IsChatActive === "Chat" ? (
                  contacts.length > 0 ? (
                    contacts.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        onClick={() => togglePeerSelection(user?.User2)}
                        showCheckbox={true}
                        isSelected={selectedPeer?._id === user?.User2?._id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto mb-3 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>

                      <p>No contacts found</p>
                    </div>
                  )
                ) : groups.length > 0 ? (
                  groups.map((group) => (
                    <UserCard
                      key={group._id}
                      user={group}
                      isGroup={true}
                      onClick={() => togglePeerSelection(group)}
                      showCheckbox={true}
                      isSelected={selectedPeer?._id === group._id}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-neutral-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto mb-3 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>

                    <p>No groups found</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() =>
                  setShareModalOpen({ isOpen: false, post: null })
                  }
                  className="flex-1 py-3 px-4 bg-neutral-700/50 text-neutral-300 rounded-lg hover:bg-neutral-600/50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    if (!selectedPeer) return;

                    const isGroup = IsChatActive === "Group";

                    const path = isGroup
                      ? `groupChats/${selectedPeer._id}/messages`
                      : null;

                    handleShareToPeer(selectedPeer._id, isGroup, path);
                  }}
                  disabled={!selectedPeer}
                  className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                    selectedPeer
                      ? "bg-gradient-to-r from-purple-600 to-amber-500 text-white hover:from-purple-500 hover:to-amber-400"
                      : "bg-neutral-700/30 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pdfModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-800/95 backdrop-blur-lg rounded-2xl border border-neutral-700/50 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-neutral-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">PDF Viewer</h3>

              <button
                onClick={closePdfModal}
                className="p-2 hover:bg-neutral-700/50 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 flex items-center justify-between bg-neutral-900/50">
              <button
                onClick={previousPage}
                disabled={pdfModal.pageNumber <= 1}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pdfModal.pageNumber <= 1
                    ? "bg-neutral-700/30 text-neutral-500 cursor-not-allowed"
                    : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                }`}
              >
                Previous
              </button>

              <span className="text-neutral-300">
                Page {pdfModal.pageNumber} of {pdfModal.numPages}
              </span>

              <button
                onClick={nextPage}
                disabled={pdfModal.pageNumber >= pdfModal.numPages}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pdfModal.pageNumber >= pdfModal.numPages
                    ? "bg-neutral-700/30 text-neutral-500 cursor-not-allowed"
                    : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                }`}
              >
                Next
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex justify-center">
              {pdfLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* <Document

                file={pdfModal.url}

                onLoadSuccess={onDocumentLoadSuccess}

                onLoadError={() => setPdfLoading(false)}

                loading={

                  <div className="flex items-center justify-center py-12">

                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>

                  </div>

                }

              >

                <Page 

                  pageNumber={pdfModal.pageNumber} 

                  width={Math.min(800, window.innerWidth - 40)}

                  loading={

                    <div className="flex items-center justify-center py-12">

                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>

                    </div>

                  }

                />

              </Document> */}
            </div>
          </div>
        </div>
      )}

      {rawContentModal.isOpen && (
        <RawToPdfConverter
          content={rawContentModal.content}
          type={rawContentModal.type}
          fileName={rawContentModal.fileName}
          convertedPdfUrl={rawContentModal.convertedPdfUrl}
          onConversionComplete={handleConversionComplete}
          onClose={closeRawContentModal}
        />
      )}

      {OpenCommentModel.status && (
        <CommentModel
          open={OpenCommentModel.status}
          postId={OpenCommentModel.id}
          PostownerId={OpenCommentModel.PostownerId}
          onClose={() =>
            setCommentModel({ status: false, PostownerId: null, id: null })
          }
        />
      )}
    </div>
  );
};

export default StudyVerseMain;