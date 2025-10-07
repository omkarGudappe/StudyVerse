import React, { useState, useEffect } from 'react'
import Socket from '../../../SocketConnection/Socket';
import axios from 'axios';
import { ref, push } from "firebase/database";
import { database } from "../../../Auth/AuthProviders/FirebaseSDK";

const Share = ({ onClose, shareModalOpen, ProfileData }) => {

    const [IsChatActive, setIsChatActive] = useState("Chat");
    const [selectedPeer, setSelectedPeer] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);

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
        onClose();

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

    const togglePeerSelection = (peer) => {
        if (selectedPeer?._id === peer._id) {
        setSelectedPeer(null);
        } else {
        setSelectedPeer(peer);
        }
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

  return (
     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => {onClose(); e.stopPropagation();}}>
        <div className="bg-neutral-800/90 backdrop-blur-lg rounded-2xl border border-neutral-700/50 max-w-md w-full shadow-2xl" onClick={(e)=> e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-700/50">
                <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Share Post</h3>

                <button
                    onClick={onClose}
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
                    onClick={onClose}
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
  )
}

export default Share
