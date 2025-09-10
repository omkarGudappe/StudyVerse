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
import { FaSmile } from "react-icons/fa";

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

  // Get or create chat ID based on user IDs
  const getChatId = (userId1, userId2) => {
    return userId1 > userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
  };

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

useEffect(() => {
  if (!otherUser || !ProfileData) return;

  // Reset messages when switching users
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

  // Cleanup
  return () => {
    off(messagesRef);
  };
}, [otherUser, ProfileData, isSending]);


// useEffect(() => {
//   if (!otherUser || !ProfileData) return;

//   // Reset messages when switching users
//   setMessages([]);
//   setIsLoading(true);

//   const chatId = getChatId(ProfileData._id, otherUser._id);
//   const messagesRef = query(
//     ref(database, `chats/${chatId}/messages`),
//     orderByChild("timestamp"),
//     limitToLast(100)
//   );

//   const listener = onValue(
//     messagesRef,
//     (snapshot) => {
//       const messagesData = [];
//       snapshot.forEach((childSnapshot) => {
//         messagesData.push({
//           id: childSnapshot.key,
//           ...childSnapshot.val(),
//         });
//       });

//       // FIX: Sort in descending order (newest first)
//       messagesData.sort((a, b) => b.timestamp - a.timestamp);
//       setMessages(messagesData);
//       setIsLoading(false);

//       setTimeout(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//       }, 100);
//     },
//     (error) => {
//       console.error("Error fetching messages:", error);
//       setIsLoading(false);
//     }
//   );

//   // Cleanup
//   return () => {
//     off(messagesRef);
//   };
// }, [otherUser, ProfileData, isSending]);


  useEffect(() => {
    // Focus input once loading is complete
    if (!isLoading && !isFetchingUser) {
      inputRef.current?.focus();
    }
  }, [isLoading, isFetchingUser]);

const sendMessage = async () => {
  if (!newMessage.trim() || !otherUser || !ProfileData) return;

  const senderMongoId = ProfileData._id;
  const senderFirebaseUid = ProfileData.firebaseUid;
  const otherFirebaseUid = otherUser.firebaseUid;

  if (!senderFirebaseUid || !otherFirebaseUid) {
    console.error("❌ Missing Firebase UIDs for sender or recipient.");
    return;
  }

  const chatId = getChatId(ProfileData._id, otherUser._id);

  const messageData = {
    senderId: senderMongoId,
    senderUid: senderFirebaseUid,
    text: newMessage.trim(),
    timestamp: Date.now()
  };

  // 1. Ensure chat metadata exists
  try {
    const chatRef = ref(database, `chats/${chatId}`);
    await update(chatRef, {
      participants: {
        [senderFirebaseUid]: true,
        [otherFirebaseUid]: true,
      },
      lastMessage: newMessage.trim(),
      updatedAt: Date.now(),
    });
    console.log("✅ Chat metadata created/updated");
  } catch (err) {
    console.error("❌ Failed to create chat metadata:", err);
    return;
  }

  // 2. Add the new message
  try {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMsgRef = push(messagesRef);
    await set(newMsgRef, messageData);
    console.log("✅ Message saved");
  } catch (err) {
    console.error("❌ Failed to save message:", err);
    return;
  }

  // 3. Update userChats for sender
  try {
    const userChatRef = ref(database, `userChats/${senderFirebaseUid}/${chatId}`);
    await update(userChatRef, {
      otherUserFirebaseUid: otherFirebaseUid,
      otherUserMongoId: otherUser._id,
      lastMessage: newMessage.trim(),
      timestamp: Date.now(),
    });
    console.log("✅ Sender userChat updated");
  } catch (err) {
    console.error("❌ Failed to update sender userChat:", err);
  }

  // 4. Update userChats for recipient
  try {
    const otherUserChatRef = ref(database, `userChats/${otherFirebaseUid}/${chatId}`);
    await update(otherUserChatRef, {
      otherUserFirebaseUid: senderFirebaseUid,
      otherUserMongoId: senderMongoId,
      lastMessage: newMessage.trim(),
      timestamp: Date.now(),
    });
    console.log("✅ Recipient userChat updated");
  } catch (err) {
    console.error("❌ Failed to update recipient userChat:", err);
  }

  // Reset input if everything went fine
  setNewMessage("");
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

  // Show loading if still fetching user or messages
  if (isFetchingUser || !otherUser) {
    return (
      <div className="flex flex-col h-full bg-neutral-900 text-white items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p>Loading user information...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-neutral-700 bg-neutral-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center overflow-hidden border-2 border-neutral-700">
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
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-800"></div>
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {otherUser.firstName} {otherUser.lastName}
            </h2>
            <i className="text-purple-900 text-sm">{otherUser.username}</i>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-900 bg-gradient-to-b from-neutral-900/80 to-neutral-900">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-neutral-400">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
            <p className="text-center mb-6 max-w-md">
              Start a conversation with {otherUser.firstName} by sending a message below.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startConversation}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Start Conversation
            </motion.button>
            
            {/* Conversation starters */}
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
                    className="bg-neutral-800 p-3 rounded-lg cursor-pointer hover:bg-neutral-750 transition-colors"
                    onClick={() => setNewMessage(starter)}
                  >
                    <p className="text-sm">{starter}</p>
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
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 flex items-center justify-center overflow-hidden mt-1">
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
                  <div className="w-8"></div> // Spacer for consistent alignment
                )}
                
                <div className={`max-w-[70%] flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      isOwnMessage
                        ? "bg-purple-600 rounded-br-md"
                        : "bg-neutral-800 rounded-bl-md"
                    }`}
                  >
                    <p className="text-white">{msg.text}</p>
                  </div>
                  
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

      {/* Message Input - Always show even when no messages */}
      <div className="p-4 border-t border-neutral-700 bg-neutral-800/50 backdrop-blur-sm sticky bottom-0">
        <div className="flex items-center gap-2">
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Insert Emoji"
            >
              <FaSmile />
            </button>
            {showEmojiPicker && (
              <div className="absolute left-0 mt-1 z-50">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </div>
            )}
          </div>
          <button className="p-2 text-neutral-400 hover:text-white rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage() && setIsSending(true)}
            className="flex-1 p-3 rounded-xl bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-neutral-500"
            placeholder="Type your message..."
          />
          
          <button
            onClick={() => sendMessage() && setIsSending(true)}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-xl font-semibold transition-all ${
              newMessage.trim()
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;