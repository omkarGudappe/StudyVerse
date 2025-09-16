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
} from "firebase/database";
import { database } from "../../Auth/AuthProviders/FirebaseSDK";
import { motion, AnimatePresence } from "framer-motion";
import { UserDataContextExport } from "./CurrentUserContexProvider";
import { useParams } from "react-router-dom";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { FaSmile, FaPaperclip, FaPaperPlane, FaFile, FaImage, FaDownload, FaTimes } from "react-icons/fa";
import { serverTimestamp } from "firebase/database";
import Socket from '../../SocketConnection/Socket';

const Messages = () => {
  const { userName } = useParams();
  const { ProfileData } = UserDataContextExport();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
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
  
  // Check if device is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close emoji picker when clicking outside
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

  const getChatId = (userId1, userId2) => {
    return userId1 > userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
  };

  // Fetch other user data
  useEffect(() => {
    if (!userName || !ProfileData) return;

    const fetchOtherUser = async () => {
      try {
        setIsFetchingUser(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/friend/username/${userName}`);
        setOtherUser(res.data.user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsFetchingUser(false);
      }
    };

    fetchOtherUser();
  }, [userName, ProfileData]);

  // Fetch messages
  useEffect(() => {
    if (!otherUser || !ProfileData) return;

    setMessages([]);
    setIsLoading(true);

    const chatId = getChatId(ProfileData._id, otherUser._id);
    const messagesRef = query(
      ref(database, `chats/${chatId}/messages`),
      orderByChild("timestamp"),
      limitToLast(100)
    );

    const listener = onValue(
      messagesRef,
      (snapshot) => {
        const messagesData = [];
        snapshot.forEach((childSnapshot) => {
          messagesData.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
          });
        });

        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData);
        setIsLoading(false);

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
  }, [otherUser, ProfileData]);

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
    if (!isLoading && !isFetchingUser) {
      inputRef.current?.focus();
    }
  }, [isLoading, isFetchingUser]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !otherUser || !ProfileData) return;

    setIsSending(true);
    let fileUrlData = { url: "", type: "" };

    // Upload file if one is selected
    if (selectedFile) {
      try {
        fileUrlData = await GetFileUrlfromBackend();
        if (!fileUrlData.url) {
          console.error("Failed to upload file");
          setIsSending(false);
          return;
        }
      } catch (error) {
        console.error("File upload error:", error);
        setIsSending(false);
        return;
      }
    }

    const senderMongoId = ProfileData._id;
    const senderFirebaseUid = ProfileData.firebaseUid;
    const otherFirebaseUid = otherUser.firebaseUid;

    if (!senderFirebaseUid || !otherFirebaseUid) {
      console.error("❌ Missing Firebase UIDs for sender or recipient.");
      setIsSending(false);
      return;
    }

    const chatId = getChatId(ProfileData._id, otherUser._id);

    // Prepare message data
    const messageData = {
      senderId: senderMongoId,
      senderUid: senderFirebaseUid,
      text: newMessage.trim(),
      timestamp: serverTimestamp()
    };

    // Add file data to message if available
    if (fileUrlData.url) {
      messageData.file = {
        url: fileUrlData.url,
        type: fileUrlData.type,
        name: selectedFile.name,
        size: selectedFile.size
      };
    }

    try {
      const chatRef = ref(database, `chats/${chatId}`);
      await update(chatRef, {
        participants: {
          [senderFirebaseUid]: true,
          [otherFirebaseUid]: true,
        },
        lastMessage: newMessage.trim() || (fileUrlData.url ? "Shared a file" : ""),
        updatedAt: serverTimestamp(),
      });
      console.log("✅ Chat metadata created/updated");
    } catch (err) {
      console.error("❌ Failed to create chat metadata:", err);
      setIsSending(false);
      return;
    }

    try {
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMsgRef = push(messagesRef);
      await set(newMsgRef, messageData);
      console.log("✅ Message saved");
    } catch (err) {
      console.error("❌ Failed to save message:", err);
      setIsSending(false);
      return;
    }

    try {
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
      console.log("✅ Sender userChat updated");
    } catch (err) {
      console.error("❌ Failed to update sender userChat:", err);
    }

    try {
      const otherUserChatRef = ref(database, `userChats/${otherFirebaseUid}/${chatId}`);
      await update(otherUserChatRef, {
        otherUserFirebaseUid: senderFirebaseUid,
        otherUserMongoId: senderMongoId,
        lastMessage: newMessage.trim() || (fileUrlData.url ? "Shared a file" : ""),
        timestamp: serverTimestamp(),
      });
      console.log("✅ Recipient userChat updated");
    } catch (err) {
      console.error("❌ Failed to update recipient userChat:", err);
    }

    // Reset states
    setNewMessage("");
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
    if (!previousMsg) return false;
    return (
      currentMsg.senderId === previousMsg.senderId && 
      (currentMsg.timestamp - previousMsg.timestamp) < 300000
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

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setFileInfo({ name: "", type: "", size: 0 });
  }

  const isImageFile = (fileType) => {
    return fileType && fileType.startsWith('image');
  }

  if (isFetchingUser || !otherUser) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 to-neutral-800 text-white items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-neutral-300">Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
      {/* Header */}
      <div className="p-4 border-b border-neutral-700 bg-neutral-800/80 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center overflow-hidden border-2 border-neutral-700 shadow-lg">
              {otherUser?.UserProfile?.avatar?.url ? (
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
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-900"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {otherUser.firstName} {otherUser.lastName}
            </h2>
            <p className="text-neutral-400 text-sm">Online</p>
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-neutral-900/80 to-neutral-900 ${isMobile ? 'pb-24' : ''}`} ref={chatContainerRef}>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-neutral-400">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 py-8">
            <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No messages yet</h3>
            <p className="text-center mb-6 max-w-md text-neutral-300">
              Start a conversation with {otherUser.firstName} by sending a message below.
            </p>
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
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.senderId === ProfileData._id;
            const showAvatar = !isOwnMessage && !isConsecutiveMessage(msg, messages[index - 1]);
            const showTimestamp = index === messages.length - 1 || 
              (messages[index + 1] && 
              (messages[index + 1].senderId !== msg.senderId || 
              (messages[index + 1].timestamp - msg.timestamp) > 300000));

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
                    {otherUser?.UserProfile?.avatar?.url ? (
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
                
                <div className={`max-w-[70%] flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                  <motion.div
                    whileTap={{ scale: 0.98 }}
                    className={`p-2 rounded-2xl shadow-md ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-purple-600 to-amber-500 text-white rounded-br-md"
                        : "bg-neutral-700 text-white rounded-bl-md"
                    }`}
                  >
                    
                    {msg.file && (
                      <div className="mt-2">
                        {isImageFile(msg.file.type) ? (
                          <div className="max-w-xs block overflow-hidden rounded-lg border border-neutral-600">
                            <img 
                              src={msg.file.url} 
                              alt="Shared image" 
                              className="w-full h-auto max-h-64 object-contain"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5 backdrop-blur-sm">
                              <FaDownload className="h-3 w-3 text-white" />
                            </div>
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
                      {msg.text && <p className="text-white text-end ">{msg.text}</p>}
                  </motion.div>
                  
                  {showTimestamp && (
                    <span className="text-xs text-neutral-500 mt-1 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-4 border-t border-neutral-700 bg-neutral-800/80 backdrop-blur-sm ${isMobile ? 'fixed bottom-16 left-0 right-0 z-10' : 'sticky bottom-0 z-10'} flex-shrink-0`}>
        {(previewImage || selectedFile) && (
          <div className="relative mb-3 max-w-xs rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800 shadow-md">
            {previewImage ? (
              <>
                <img src={previewImage} alt="Preview" className="w-full h-auto max-h-32 object-contain" />
                <button 
                  className="absolute top-1 right-1 bg-neutral-900/70 rounded-full p-1 text-white hover:bg-neutral-900 transition-colors"
                  onClick={removeFile}
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="p-3 flex items-center gap-3">
                <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-lg">
                  <FaFile className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{fileInfo.name}</p>
                  <p className="text-neutral-300 text-xs">{formatFileSize(fileInfo.size)}</p>
                </div>
                <button 
                  className="text-neutral-400 hover:text-white transition-colors"
                  onClick={removeFile}
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2 w-full">
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
              className="cursor-pointer p-2 text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-neutral-700"
            >
              <FaSmile className="h-5 w-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          
          <label htmlFor="file" className="p-2 cursor-pointer text-neutral-400 hover:text-white rounded-lg transition-colors hover:bg-neutral-700">
            <FaPaperclip className="h-5 w-5" />
          </label>
          <input 
            onChange={handleFileChange} 
            type="file" 
            name="file" 
            className="hidden" 
            id="file" 
          />
          
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (newMessage.trim() || selectedFile) {
                  sendMessage();
                }
              }
            }}
            className="flex-1 p-3 rounded-xl bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-neutral-500 text-white"
            placeholder="Type your message..."
          />
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || isSending}
            className={`p-3 rounded-xl font-semibold transition-all flex items-center justify-center ${
              (newMessage.trim() || selectedFile) && !isSending
                ? "bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-md"
                : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
            }`}
          >
            {isSending ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaPaperPlane className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Messages;