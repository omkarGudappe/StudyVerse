import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MessagesPanel from './Panels/MessagesPanel';
import { UserDataContextExport } from "./CurrentUserContexProvider";
import Socket from '../../SocketConnection/Socket';
import { ref, set, serverTimestamp } from "firebase/database";
import { database } from "../../Auth/AuthProviders/FirebaseSDK";

const MessageContact = ({ open, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contacts, setContacts] = useState([]);
  const { ProfileData } = UserDataContextExport();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('contacts');
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [modalSearchResults, setModalSearchResults] = useState([]);
  const [isModalSearching, setIsModalSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        setError(null);
        if (activeTab === 'search') setActiveTab('contacts');
        return;
      }

      const FindFriend = async () => {
        try {
          setIsLoading(true);
          setError(null);
          setActiveTab('search');
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/search?query=${searchTerm}`);
          const Data = res.data;
          if (Data.users) {
            setSearchResults(Data.users);
          }
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || "Failed to search users");
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      FindFriend();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    if (showGroupModal) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "auto";
    }
    return () => {
        document.body.style.overflow = "auto";
    };
  }, [showGroupModal]);

  useEffect(() => {
    if (!showGroupModal) return;
    
    const delayDebounceFn = setTimeout(() => {
      if (modalSearchTerm.trim() === "") {
        setModalSearchResults([]);
        return;
      }

      const searchInModal = async () => {
        try {
          setIsModalSearching(true);
          const token = localStorage.getItem('token');
          if(!token) {
            throw new Error('No auth token found');
          }
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/user/searchUser?query=${modalSearchTerm}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          const Data = res.data;
          if (Data.users) {
            setModalSearchResults(Data.users);
          }
        } catch (err) {
          console.error(err);
          setModalSearchResults([]);
        } finally {
          setIsModalSearching(false);
        }
      };
      
      searchInModal();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [modalSearchTerm, showGroupModal]);

  const FUID = ProfileData?.firebaseUid;

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setSearchResults([]);
    setError(null);
    setActiveTab('contacts');
  }, []);

  // Fetch contacts and groups
  useEffect(() => {
    const Id = ProfileData?._id;
    if(!Id) return;
    
    Socket.emit("SendContactUsers", {ID: Id });
    
    Socket.on("ContactUsers", (data) => {
      if(!data) return;
      setContacts(data.User || []);
      setGroups(data.Groups || []);
    });

    return () => {
      Socket.off("ContactUsers");
    };
  }, [open, ProfileData]);

  const toggleMemberSelection = (user) => {
    if (selectedMembers.some(member => member._id === user._id)) {
      setSelectedMembers(selectedMembers.filter(member => member._id !== user._id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      setCreateError("Please provide a group name and select at least one member");
      return;
    }

    setCreateError(null);
    setIsCreatingGroup(true);

    try {
      const CreatorId = ProfileData?._id;
      const CreatorUid = ProfileData?.firebaseUid;
      const memberIds = selectedMembers.map(member => member._id);
      const memberUids = selectedMembers.map(member => member.firebaseUid);

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/group/create`, {
        name: groupName,
        createdBy: CreatorId,
        members: memberIds,
      });

      if (res.data.ok) {
        const group = res.data.group;

        const groupRef = ref(database, `groupChats/${group._id}`);

        const membersObject = {};
          selectedMembers.forEach(member => {
            if (member.firebaseUid) membersObject[member.firebaseUid] = true;
        });
        if (CreatorUid) membersObject[CreatorUid] = true;

        await set(groupRef, {
          name: groupName,
          createdBy: CreatorUid,
          members: membersObject,
          createdAt: serverTimestamp(),
        });

        setGroupName("");
        setSelectedMembers([]);
        setShowGroupModal(false);
        setModalSearchTerm("");
        setModalSearchResults([]);
        
        Socket.emit("SendContactUsers", { ID: CreatorId });
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      console.error("Failed to create group:", err);
      setCreateError(err.response?.data?.message || err.message || "Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  console.log("Chking group", groups);

  const UserCard = ({ user, isGroup = false, onClick, showCheckbox = false, isSelected = false }) => {
    const displayName = isGroup ? user.name : `${user.firstName} ${user.lastName}`;
    const username = isGroup ? `${user?.members?.length} Members` : user.username;
    const subtitle = isGroup 
      ? '' 
      : (user.education ? (user.education.standard || user.education.degree) : '');
    
    const avatarContent = isGroup && user?.avatar ? (
      <img
        src={user?.avatar}
        alt={displayName}
        className="w-full h-full object-cover"
      />
    ) : isGroup && !user?.avatar ? (
      <span className="text-white font-semibold text-lg">
        {displayName?.[0]}{displayName?.[1]}
      </span>
    ) : user.UserProfile?.avatar?.url ? (
      <img
        src={user.UserProfile.avatar.url}
        alt={displayName}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-white font-semibold text-lg">
        {user.firstName?.[0]}{user.lastName?.[0]}
      </span>
    );

    return (
      <div
        className={`cursor-pointer flex items-center gap-4 w-full  p-4 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-all duration-200 group ${showCheckbox ? 'pr-3' : ''}`}
        onClick={onClick}
      >
        {showCheckbox && (
          <div 
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected ? 'bg-purple-500 border-purple-500' : 'border-neutral-500'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
        
        <div className="relative flex-shrink-0">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 border-neutral-700 group-hover:border-purple-500 transition-colors ${
            isGroup ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-purple-600 to-amber-600'
          }`}>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      );
    }

    if (activeTab === 'search' && searchResults.length === 0 && searchTerm) {
      return (
        <div className="text-center py-12 text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No users found for "{searchTerm}"</p>
        </div>
      );
    }

    if (activeTab === 'search' && searchResults.length > 0) {
      return (
        <div className="space-y-3 w-full pb-15">
          <p className="text-neutral-400 text-sm mb-4">
            Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
          </p>
          {searchResults.map((user, index) => (
            <Link 
              key={user._id || index}
              to={`/messages/${encodeURIComponent(user?.username)}`}
              onClick={onClose}
              className='flex gap-3 w-full'
            >
              <UserCard user={user} />
            </Link>
          ))}
        </div>
      );
    }

    if (activeTab === 'contacts' && contacts.length > 0) {
      return (
        <div className="space-y-3 pb-15">
          {contacts.map((contact, index) => (
            <Link 
              key={contact._id || index}
              to={`/messages/${encodeURIComponent(contact?.User2?.username)}`}
              onClick={onClose}
              className='flex gap-3 w-full'
            >
              <UserCard user={contact.User2} />
            </Link>
          ))}
        </div>
      );
    }

    if (activeTab === 'groups' && groups.length > 0) {
      return (
        <div className="space-y-3 pb-15">
          {groups.map((group, index) => (
            <Link 
              key={group._id || index}
              to={`/group-chat/${group._id}`}
              onClick={onClose}
              className='flex gap-3 w-full'
            >
              <UserCard user={group} isGroup={true} />
            </Link>
          ))}
        </div>
      );
    }

    if (activeTab === 'contacts' && contacts.length === 0) {
      return (
        <div className="text-center py-12 text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>No contacts yet</p>
          <p className="text-sm mt-2">Start conversations with people you know</p>
        </div>
      );
    }

    if (activeTab === 'groups' && groups.length === 0) {
      return (
        <div className="text-center py-12 text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p>No groups yet</p>
          <p className="text-sm mt-2">Create a group to start chatting with multiple people</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGroupModal(true)}
            className="mt-4 py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-medium"
          >
            Create Your First Group
          </motion.button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <MessagesPanel 
          open={open} 
          onClose={onClose}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={clearSearch}
      >
        <div className="p-6 h-auto lenis">
          <div className="mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowGroupModal(true)}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Group Chat
            </motion.button>
          </div>
          
          <div className="flex mb-6 bg-neutral-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'contacts' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Contacts
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'groups' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Groups
            </button>
            {searchTerm && (
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'search' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Search
              </button>
            )}
          </div>
          
          {renderContent()}
        </div>
      </MessagesPanel>

      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-800 lenis rounded-2xl p-6 max-w-md w-full border border-neutral-700 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Create Group Chat</h3>
                <button 
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedMembers([]);
                    setCreateError(null);
                    setModalSearchTerm("");
                    setModalSearchResults([]);
                  }}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {createError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {createError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-neutral-300 text-sm font-medium mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter group name"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-neutral-300 text-sm font-medium mb-2">
                  Select Members ({selectedMembers.length})
                </label>
                
                {/* Search input in modal */}
                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Search for users to add..."
                  />
                  {modalSearchTerm && (
                    <button
                      onClick={() => setModalSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="max-h-40 overflow-y-auto bg-neutral-700 rounded-lg p-2">
                  {isModalSearching ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : modalSearchTerm && modalSearchResults.length > 0 ? (
                    modalSearchResults.map(user => (
                      <div 
                        key={user._id} 
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedMembers.some(m => m._id === user._id) 
                            ? 'bg-purple-600/30' 
                            : 'hover:bg-neutral-600'
                        }`}
                        onClick={() => toggleMemberSelection(user)}
                      >
                        <UserCard 
                          user={user} 
                          showCheckbox={true}
                          isSelected={selectedMembers.some(m => m._id === user._id)}
                          onClick={() => toggleMemberSelection(user)}
                        />
                      </div>
                    ))
                  ) : contacts.length > 0 ? (
                    contacts.map(contact => (
                      <div 
                        key={contact._id} 
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          selectedMembers.some(m => m._id === contact.User2._id) 
                            ? 'bg-purple-600/30' 
                            : 'hover:bg-neutral-600'
                        }`}
                        onClick={() => toggleMemberSelection(contact.User2)}
                      >
                        <UserCard 
                          user={contact.User2} 
                          showCheckbox={true}
                          isSelected={selectedMembers.some(m => m._id === contact.User2._id)}
                          onClick={() => toggleMemberSelection(contact.User2)}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-400 text-center py-4">No contacts available</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedMembers([]);
                    setCreateError(null);
                    setModalSearchTerm("");
                    setModalSearchResults([]);
                  }}
                  className="flex-1 py-2 px-4 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center"
                >
                  {isCreatingGroup ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MessageContact;