import React, { useState, useEffect, useRef } from "react";
import {
  ref,
  push,
  set,
  onValue,
  off,
  orderByChild,
  query,
  limitToLast,
  update,
  serverTimestamp
} from "firebase/database";
import { database } from "../../Auth/AuthProviders/FirebaseSDK";
import { motion, AnimatePresence } from "framer-motion";
import { UserDataContextExport } from "./CurrentUserContexProvider";
import { useParams } from "react-router-dom";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { FaSmile, FaPaperclip, FaPaperPlane, FaFile, FaImage, FaDownload, FaTimes, FaUsers, FaUser, FaCheck, FaCheckDouble, FaClock } from "react-icons/fa";
import Socket from '../../SocketConnection/Socket';
import OpenPostModel from "./SmallComponents/OpenPostModel";
import GroupDetailModel from "./SmallComponents/GroupDetailModel";

const Messages = () => {
  const { userName, groupId } = useParams();
  const { ProfileData } = UserDataContextExport();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInfo, setFileInfo] = useState({ name: "", type: "", size: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sharedPosts, setSharedPosts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [openPostModel, setOpenPostModel] = useState({
    status: false,
    id: null
  });
  const [OnlineStatus, setOnlieStatus] = useState();
  const [OpenGroupDetailModel, setOpenGroupDetailModel] = useState(false);

  // Track pending messages and their status
  const [pendingMessages, setPendingMessages] = useState({});
  
  // Check if device is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isGroupChat = !!groupId;
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onEmojiClick = (emojiData) => {
    inputRef.current.focus()
    setNewMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const getChatId = () => {
    if (isGroupChat) {
      return groupId;
    } else {
      if (!otherUser || !ProfileData) return null;
      const userId1 = ProfileData._id;
      const userId2 = otherUser._id;
      return userId1 > userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
    }
  };

  const getDatabasePath = () => {
    return isGroupChat ? `groupChats/${groupId}` : `chats/${getChatId()}`;
  };

  useEffect(() => {
    if (isGroupChat || !userName || !ProfileData) return;

    const fetchOtherUser = async () => {
      try {
        setIsFetching(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/friend/username/${userName}`);
        setOtherUser(res.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchOtherUser();
  }, [userName, ProfileData, isGroupChat]);

     const fetchGroupData = async () => {
      try {
        setIsFetching(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/group/${groupId}`);
        
        if (res.data.ok && res.data.group) {
          setGroupData(res.data.group);
          console.log(res.data.group.members);
        } else {
          console.error("Unexpected response structure:", res.data);
          setGroupData({
            _id: groupId,
            name: "Unknown Group",
            members: []
          });
        }
      } catch (error) {
        console.error("Error fetching group:", error);
        setGroupData({
          _id: groupId,
          name: "Unknown Group",
          members: []
        });
      } finally {
        setIsFetching(false);
      }
    };

  useEffect(() => {
    if (!isGroupChat || !groupId || !ProfileData) return;
    fetchGroupData();
  }, [groupId, ProfileData, isGroupChat]);

  useEffect(() => {
    const handleIncomingSharedPost = (data) => {
      setSharedPosts(prev => ({
        ...prev,
        [data.postId]: data.postData
      }));
    };

    Socket.on("post-shared", handleIncomingSharedPost);

    return () => {
      Socket.off("post-shared", handleIncomingSharedPost);
    };
  }, []);

  const sharePostInChat = (postId) => {
    if (!sharedPosts[postId]) return;
    
    const messageText = `Check out this post: ${sharedPosts[postId].heading || 'Shared post'}`;
    setNewMessage(messageText);
    sendMessage(postId);
  };

  // Listen for messages
  useEffect(() => {
    const chatId = getChatId();
    if (!chatId) return;

    setMessages([]);
    setIsLoading(true);

    const messagesRef = query(
      ref(database, `${getDatabasePath()}/messages`),
      orderByChild("timestamp"),
      limitToLast(100)
    );

    const listener = onValue(
      messagesRef,
      (snapshot) => {
        const messagesData = [];
        snapshot.forEach((childSnapshot) => {
          const message = {
            id: childSnapshot.key,
            ...childSnapshot.val(),
          };
          
          // Remove from pending if this message is now confirmed
          if (pendingMessages[message.tempId]) {
            setPendingMessages(prev => {
              const newPending = { ...prev };
              delete newPending[message.tempId];
              return newPending;
            });
          }
          
          messagesData.push(message);
        });

        // Sort messages by timestamp in ascending order (oldest first)
        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData.reverse());
        setIsLoading(false);

        // Scroll to bottom after messages are loaded
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      },
      (error) => {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
      }
    );

    return () => {
      off(messagesRef);
    };
  }, [otherUser, groupData, ProfileData, isGroupChat]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const GetFileUrlfromBackend = async () => {
    if(!selectedFile) return { url: "", type: "" };

    try{
      const Form = new FormData();
      Form.append("file", selectedFile);
      const GetUrl = await axios.post(`${import.meta.env.VITE_API_URL}/user/messages/fileupload`,
        Form,
        { headers: { 'Content-Type' : "multipart/form-data"} }
       );

       if(GetUrl.data.ok){
         const { url, type } = GetUrl.data;
         return { url, type };
       }
       return { url: "", type: "" };

    }catch(err){
      console.log(err.message);
      return { url: "", type: "" };
    }
  }

  useEffect(() => {
    if (!isLoading && !isFetching) {
      inputRef.current?.focus();
    }
  }, [isLoading, isFetching]);

  // Generate unique temporary ID for pending messages
  const generateTempId = () => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const sendMessage = async (sharedPostId = null) => {
    if ((!newMessage.trim() && !selectedFile && !sharedPostId) || 
        (!isGroupChat && !otherUser) || 
        (isGroupChat && !groupData) || 
        !ProfileData) return;

    // setIsSending(true);
    
    // Generate temporary ID for this message
    const tempId = generateTempId();
    
    const senderMongoId = ProfileData._id;
    const senderFirebaseUid = ProfileData.firebaseUid;
    const chatId = getChatId();
    const databasePath = getDatabasePath();

    if (!senderFirebaseUid || !chatId) {
      console.error("❌ Missing required data for sending message");
      setIsSending(false);
      return;
    }

    // Create temporary message data for immediate display
    const tempMessageData = {
      id: tempId,
      tempId: tempId,
      senderId: senderMongoId,
      senderUid: senderFirebaseUid,
      text: newMessage.trim(),
      timestamp: Date.now(),
      status: 'pending' // pending, sent, delivered, read
    };

    if (isGroupChat) {
      tempMessageData.senderName = `${ProfileData.firstName} ${ProfileData.lastName}`;
    }

    if (sharedPostId && sharedPosts[sharedPostId]) {
      tempMessageData.sharedPost = sharedPosts[sharedPostId];
    }

    // Add temporary message to local state immediately
    setMessages(prev => [tempMessageData, ...prev]);
    
    // Add to pending messages
    setPendingMessages(prev => ({
      ...prev,
      [tempId]: {
        data: tempMessageData,
        timestamp: Date.now()
      }
    }));

    let fileUrlData = { url: "", type: "" };

    

    if (selectedFile) {
      try {
        setIsSending(true);
        fileUrlData = await GetFileUrlfromBackend();
        if (!fileUrlData.url) {
          console.error("Failed to upload file");
          setMessages(prev => prev.map(msg => 
            msg.id === tempId ? { ...msg, status: 'failed' } : msg
          ));
          setIsSending(false);
          setNewMessage("");
          return;
        }
      } catch (error) {
        console.error("File upload error:", error);
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? { ...msg, status: 'failed' } : msg
        ));
        setIsSending(false);
        return;
      }
    }else {
      setNewMessage("");
    }

    
    const messageData = {
      senderId: senderMongoId,
      senderUid: senderFirebaseUid,
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
      tempId: tempId // Include tempId to match with pending message
    };

    if (isGroupChat) {
      messageData.senderName = `${ProfileData.firstName} ${ProfileData.lastName}`;
    }

    if (sharedPostId && sharedPosts[sharedPostId]) {
      messageData.sharedPost = sharedPosts[sharedPostId];
    }

    if (fileUrlData.url) {
      messageData.file = {
        url: fileUrlData.url,
        type: fileUrlData.type,
        name: selectedFile.name,
        size: selectedFile.size
      };
    }

    try {
      const chatRef = ref(database, databasePath);
      await update(chatRef, {
        lastMessage: newMessage.trim() || (fileUrlData.url ? "Shared a file" : ""),
        updatedAt: serverTimestamp(),
      });
      
      if (!isGroupChat) {
        const otherFirebaseUid = otherUser.firebaseUid;
        await update(chatRef, {
          participants: {
            [senderFirebaseUid]: true,
            [otherFirebaseUid]: true,
          },
        });
      }
      
      console.log("✅ Chat metadata updated");
    } catch (err) {
      console.error("❌ Failed to update chat metadata:", err);
    }

    try {
      const messagesRef = ref(database, `${databasePath}/messages`);
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, messageData);
      console.log("✅ Message saved");
      
      // Update local message status to sent
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'sent' } : msg
      ));
      
    } catch (err) {
      console.error("❌ Failed to save message:", err);
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
      setIsSending(false);
      return;
    }

    if (!isGroupChat) {
        Socket.emit("UpdateContactRecentMessage", {
          userId: senderMongoId,
          contactId: otherUser._id,
          message: newMessage.trim() || (fileUrlData.url ? "📎 File" : (sharedPostId ? "📍 Post" : "")),
          timestamp: Date.now(),
        });

      Socket.emit("UpdateContactRecentMessage", {
        userId: otherUser._id,
        contactId: senderMongoId,
        message: newMessage.trim() || (fileUrlData.url ? "📎 File" : (sharedPostId ? "📍 Post" : "")),
        timestamp: Date.now(),
        chatId: chatId
      });
      try {
        const otherFirebaseUid = otherUser.firebaseUid;
        const userChatRef = ref(database, `userChats/${senderFirebaseUid}/${chatId}`);
        await update(userChatRef, {
          otherUserFirebaseUid: otherFirebaseUid,
          otherUserMongoId: otherUser._id,
          lastMessage: newMessage.trim() || (fileUrlData.url ? "Shared a file" : ""),
          timestamp: serverTimestamp(),
        });
        
        const User1 = ProfileData._id
        const User2 = otherUser._id;   
        Socket.emit("UsersChat", { user1: User1, user2: User2, chatId: chatId})
        console.log("✅ User chats updated");
      } catch (err) {
        console.error("❌ Failed to update user chats:", err);
      }
    }

    if (isGroupChat) {
      Socket.emit("new-group-message", {
        groupId: groupId,
        message: newMessage.trim() || (fileUrlData.url ? "Shared a file" : ""),
        sender: ProfileData._id
      });
    }

    setSelectedFile(null);
    setPreviewImage(null);
    setFileInfo({ name: "", type: "", size: 0 });
    setIsSending(false);
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isConsecutiveMessage = (currentMsg, previousMsg) => {
    if (!previousMsg || isGroupChat) return false;
    return (
      currentMsg.senderId === previousMsg.senderId && 
      (currentMsg.timestamp - previousMsg.timestamp) < 300000
    );
  };

  const shouldShowTimestamp = (currentMsg, nextMsg) => {
    if (!nextMsg) return true; // Always show timestamp for last message
    
    const timeDiff = nextMsg.timestamp - currentMsg.timestamp;
    const senderChanged = nextMsg.senderId !== currentMsg.senderId;
    
    return timeDiff > 3 * 60 * 1000 || senderChanged || isGroupChat;
  };

  // Render message status indicator
  const renderMessageStatus = (message) => {
    if (message.senderId !== ProfileData._id) return null;
    
    let statusIcon;
    let statusColor;
    
    switch (message.status) {
      case 'pending':
        statusIcon = <FaClock className="h-3 w-3" />;
        statusColor = "text-neutral-400";
        break;
      case 'sent':
        statusIcon = <FaCheck className="h-3 w-3" />;
        statusColor = "text-neutral-400";
        break;
      case 'delivered':
        statusIcon = <FaCheckDouble className="h-3 w-3" />;
        statusColor = "text-neutral-400";
        break;
      case 'read':
        statusIcon = <FaCheckDouble className="h-3 w-3" />;
        statusColor = "text-blue-400";
        break;
      case 'failed':
        statusIcon = <FaTimes className="h-3 w-3" />;
        statusColor = "text-red-400";
        break;
      default:
        // For messages without status (older messages), assume delivered
        statusIcon = <FaCheckDouble className="h-3 w-3" />;
        statusColor = "text-neutral-400";
    }
    
    return (
      <span className={`ml-2 ${statusColor} flex items-center`}>
        {statusIcon}
      </span>
    );
  };

  const startConversation = () => {
    inputRef.current?.focus();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileInfo({
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
    }
  }

  useEffect(() => {
    Socket.on('UserOnlineStatus' , ({Online}) => {
      if(Online){
        setOnlieStatus('Online');
      }else {
        setOnlieStatus('no');
      }
    })

    return () => {
      Socket.off('UserOnlineStatus');
    }
  }, [])

  useEffect(() => {
    if(!otherUser && !ProfileData) return;
    const CurrentUserId = ProfileData?._id;
    const OtherUserId = otherUser?._id;
    console.log("check for frontend data is correct or not" , CurrentUserId, "and", OtherUserId);
    setOnlieStatus('');
    Socket.emit('OnlineStatus', ({ CurrentUserId, OtherUserId }));

  } , [otherUser?._id, ProfileData?._id])

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setFileInfo({ name: "", type: "", size: 0 });
  }

  const isImageFile = (fileType) => {
    return fileType && fileType.startsWith('image');
  }

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleViewPost = (postId) => {
    setOpenPostModel({
      status: true,
      id: postId
    });
  };

  console.log("Group data", groupData);

  const handleClosePostModal = () => {
    setOpenPostModel({
      status: false,
      id: null
    });
  };

  if (isFetching || (!isGroupChat && !otherUser) || (isGroupChat && !groupData)) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 to-neutral-800 text-white items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-neutral-300">Loading {isGroupChat ? 'group' : 'user'} information...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700 bg-neutral-800/80 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-neutral-700 shadow-lg ${
                isGroupChat 
                  ? "bg-gradient-to-br from-purple-600 to-indigo-600" 
                  : "bg-gradient-to-br from-purple-600 to-blue-500"
              }`}>
                {isGroupChat && groupData?.avatar ? (
                  <img
                    src={groupData?.avatar}
                    alt={`${groupData?.name?.[0]} ${groupData?.name?.[1]}`}
                    className="w-full h-full object-cover"
                  />
                ) : otherUser?.UserProfile?.avatar?.url ? (
                  <img
                    src={otherUser.UserProfile.avatar.url}
                    alt={`${otherUser.firstName} ${otherUser.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-lg">
                    {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                  </span>
                )}
              </div>
              {!isGroupChat && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-900"></div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isGroupChat ? groupData.name : `${otherUser.firstName} ${otherUser.lastName}`}
              </h2>
              <p className="text-neutral-400 text-sm">
                {isGroupChat ? `${groupData.members?.length || 0} members` : OnlineStatus}
              </p>
            </div>
          </div>
            {isGroupChat ? (
              <div className="lg:relative">
                <button onClick={() => setOpenGroupDetailModel(true)} className="p-2 rounded-full hover:bg-neutral-700/50 transition">
                  <svg xmlns="http://www.w3.org/200/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>
            ) : null}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className={`flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-neutral-900/80 to-neutral-900 ${isMobile ? 'pb-24' : ''}`} 
        ref={chatContainerRef}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-neutral-400">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-8">
            <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6 shadow-lg">
              {isGroupChat ? (
                <FaUsers className="h-12 w-12 text-purple-500" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No messages yet</h3>
            <p className="text-center mb-6 max-w-md text-neutral-300">
              {isGroupChat 
                ? `Start the conversation in ${groupData.name} by sending a message below.`
                : `Start a conversation with ${otherUser.firstName} by sending a message below.`
              }
            </p>
            {!isGroupChat && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startConversation}
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                Start Conversation
              </motion.button>
            )}
            
            {!isGroupChat && (
              <div className="mt-8 w-full max-w-md">
                <p className="text-neutral-500 text-sm mb-3">Try one of these conversation starters:</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    `Hi ${otherUser.firstName}! How are you doing today?`,
                    `Hey ${otherUser.firstName}, I saw we're both interested in studying together!`,
                    `Hello! Would you like to collaborate on some study materials?`
                  ].map((starter, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className="bg-neutral-800 p-3 rounded-lg cursor-pointer hover:bg-neutral-750 transition-all duration-200 border border-neutral-700"
                      onClick={() => setNewMessage(starter)}
                    >
                      <p className="text-sm text-neutral-200">{starter}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Regular flex column (not reverse) - messages flow from top to bottom
          <div className="flex flex-col-reverse overflow-y-auto h-full px-4 py-2">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.senderId === ProfileData._id;
              const showAvatar = !isOwnMessage && (!isConsecutiveMessage(msg, messages[index - 1]) || isGroupChat);
              const showTimestamp = shouldShowTimestamp(msg, messages[index - 1 ]);

              return (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} gap-2`}
                >
                  {!isOwnMessage && showAvatar && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center overflow-hidden mt-1 shadow-md">
                      {isGroupChat ? (
                        <span className="text-white text-xs font-semibold">
                          {msg.senderName?.[0] || 'U'}
                        </span>
                      ) : otherUser?.UserProfile?.avatar?.url ? (
                        <img
                          src={otherUser.UserProfile.avatar.url}
                          alt={`${otherUser.firstName} ${otherUser.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {otherUser?.firstName?.[0]}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {!isOwnMessage && !showAvatar && (
                    <div className="w-8"></div>
                  )}
                  
                  <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                    {!isOwnMessage && isGroupChat && showAvatar && (
                      <span className="text-xs text-neutral-500 mt-1 px-1">
                        {msg.senderName}
                      </span>
                    )}
                    
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      className={`p-3 rounded-2xl shadow-md space-y-5 mt-2 ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-br-md"
                          : "bg-neutral-700 text-white rounded-bl-md"
                      } ${msg.status === 'failed' ? 'border border-red-400' : ''}`}
                    >
                      
                      {msg.file && (
                        <div className="mt-2">
                          {isImageFile(msg.file.type) ? (
                            <div className="max-w-xs block overflow-hidden rounded-lg border border-neutral-600 relative">
                              <img 
                                src={msg.file.url} 
                                alt="Shared image" 
                                className="w-full h-auto max-h-64 object-contain"
                              />
                              <a 
                                href={msg.file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5 backdrop-blur-sm hover:bg-black/70 transition-colors"
                              >
                                <FaDownload className="h-3 w-3 text-white" />
                              </a>
                            </div>
                          ) : (
                            <a 
                              href={msg.file.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-neutral-600/50 rounded-lg hover:bg-neutral-600 transition-all duration-200 border border-neutral-600"
                            >
                              <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-lg">
                                <FaFile className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">{msg.file.name}</p>
                                <p className="text-neutral-300 text-xs">{formatFileSize(msg.file.size)}</p>
                              </div>
                              <span className="text-neutral-400 text-xs">Click to download</span>
                            </a>
                          )}
                        </div>
                      )}
                      
                      {msg.text && (
                        <p className={`text-white ${isOwnMessage ? 'text-end' : 'text-start'} break-words`}>
                          {msg.text}
                        </p>
                      )}

                      {msg.sharedPost && (
                        <div className="mt-2 p-3 bg-neutral-700/50 rounded-lg border border-neutral-600 max-w-full">
                          <p className="text-sm text-neutral-300 mb-2">Shared a post:</p>
                          <div className="flex gap-3">
                            {msg.sharedPost.files?.url && msg.sharedPost.files.url.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                              <img 
                                src={msg.sharedPost.files.url} 
                                alt="Shared post" 
                                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium mb-1">{msg.sharedPost.heading || 'Shared post'}</p>
                              <div className="text-neutral-400 text-xs">
                                {expandedPosts[msg.id] 
                                  ? msg.sharedPost.description || ''
                                  : truncateText(msg.sharedPost.description, 80)}
                                
                                {msg.sharedPost.description && msg.sharedPost.description.length > 80 && (
                                  <button 
                                    onClick={() => togglePostExpansion(msg.id)}
                                    className="text-purple-400 hover:text-purple-300 ml-1 font-medium"
                                  >
                                    {expandedPosts[msg.id] ? 'Show less' : 'Read more'}
                                  </button>
                                )}
                              </div>
                              <button 
                                onClick={() => handleViewPost(msg.sharedPost._id)}
                                className="text-xs text-purple-400 hover:text-purple-300 mt-1 font-medium"
                              >
                                View Post
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                    
                    <div className="flex items-center justify-end w-full mt-1">
                      {showTimestamp && (
                        <span className="text-xs text-neutral-500 px-1">
                          {formatTime(msg.timestamp)}
                        </span>
                      )}
                      {renderMessageStatus(msg)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t border-neutral-700 bg-neutral-800/80 backdrop-blur-sm ${isMobile ? 'fixed bottom-16 left-0 right-0 z-10' : 'sticky bottom-0 z-10'} flex-shrink-0`}>
        {/* File Preview */}
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-neutral-700 rounded-lg border border-neutral-600"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {previewImage ? (
                  <div className="relative">
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
                    <FaFile className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{fileInfo.name}</p>
                  <p className="text-neutral-400 text-xs">{formatFileSize(fileInfo.size)}</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-neutral-400 hover:text-red-400 transition-colors p-1"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex items-end gap-2">
          {/* Emoji Picker Toggle */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
          >
            <FaSmile className="h-5 w-5" />
          </button>

          {/* File Upload */}
          <label className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer flex-shrink-0">
            <FaPaperclip className="h-5 w-5" />
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
          </label>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${isGroupChat ? groupData.name : otherUser.firstName}...`}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none max-h-32"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: isSending ? 1 : 1.05 }}
            whileTap={{ scale: isSending ? 1 : 0.95 }}
            onClick={() => sendMessage()}
            disabled={isSending || (!newMessage.trim() && !selectedFile)}
            className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
              isSending 
                ? 'bg-neutral-600 cursor-not-allowed' 
                : (newMessage.trim() || selectedFile) 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600' 
                  : 'bg-neutral-700 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <FaPaperPlane className="h-4 w-4 text-white" />
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              ref={emojiPickerRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 mb-2 z-20"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width={isMobile ? '100%' : 350}
                height={400}
                previewConfig={{ showPreview: false }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {OpenGroupDetailModel && (
        <GroupDetailModel
          groupId={groupId}
          GroupData={groupData}
          onClose={() => setOpenGroupDetailModel(false)}
          currentUser={ProfileData}
          UpdateGroupData={(data) => setGroupData(data)}
        />
      )}

      {openPostModel.status && (
        <OpenPostModel
          postId={openPostModel.id}
          onClose={handleClosePostModal}
          onShare={sharePostInChat}
        />
      )}

    </div>
  );
};

export default Messages;