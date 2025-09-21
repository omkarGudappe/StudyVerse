import React, { useState, useEffect, useCallback } from 'react'
import SearchInput from './Panels/SearchInput'
import SearchResult from './SmallComponents/SearchResult';
import axios from 'axios';
import { UserDataContextExport } from "./CurrentUserContexProvider";
import Socket from '../../SocketConnection/Socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ref, set, serverTimestamp } from "firebase/database";
import { database } from "../../Auth/AuthProviders/FirebaseSDK";

const MobileContact = () => {
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
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts', 'groups', or 'search'
  const [modalSearchTerm, setModalSearchTerm] = useState(""); // Search term for modal
  const [modalSearchResults, setModalSearchResults] = useState([]); // Search results for modal
  const [isModalSearching, setIsModalSearching] = useState(false); // Loading state for modal search

  // Debounced search function for main search
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

  // Debounced search function for modal
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
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/search?query=${modalSearchTerm}`);
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
  }, [ProfileData]);

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

      // 1️⃣ Create group in your backend (MongoDB)
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/group/create`, {
        name: groupName,
        createdBy: CreatorId,
        members: memberIds,
      });

      if (res.data.ok) {
        const group = res.data.group;

        // 2️⃣ Create group in Firebase
        const groupRef = ref(database, `groupChats/${group._id}`);

        const membersObject = {};
        memberUids.forEach(uid => {
          membersObject[uid] = true;
        });
        // also add creator
        if (CreatorUid) membersObject[CreatorUid] = true;

        await set(groupRef, {
          name: groupName,
          createdBy: CreatorUid,
          members: membersObject,
          createdAt: serverTimestamp(),
        });

        // 3️⃣ UI reset
        setGroupName("");
        setSelectedMembers([]);
        setShowGroupModal(false);
        setModalSearchTerm("");
        setModalSearchResults([]);
        
        // Show success notification
        // You could implement a toast notification system here
        
        // 4️⃣ Refresh groups
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

  // User card component for reusability
  const UserCard = ({ user, isGroup = false, onClick, showCheckbox = false, isSelected = false }) => {
    const displayName = isGroup ? user.name : `${user.firstName} ${user.lastName}`;
    const username = isGroup ? `${user.members?.length || 0} members` : user.username;
    const subtitle = isGroup 
      ? `Created by ${user.createdBy?.firstName} ${user.createdBy?.lastName}` 
      : (user.education ? (user.education.standard || user.education.degree) : '');
    
    const avatarContent = isGroup ? (
      <span className="text-white font-semibold text-sm">
        {user.name?.[0]}{user.name?.[1] || ''}
      </span>
    ) : user.UserProfile?.avatar?.url ? (
      <img
        src={user.UserProfile.avatar.url}
        alt={displayName}
        className="w-full h-full object-cover"
      />
    ) : (
      <span className="text-white font-semibold text-sm">
        {user.firstName?.[0]}{user.lastName?.[0]}
      </span>
    );

    return (
      <div
        className={`cursor-pointer flex items-center gap-3 w-full p-3 bg-neutral-800 rounded-xl hover:bg-neutral-750 transition-all duration-200 group ${showCheckbox ? 'pr-3' : ''}`}
        onClick={onClick}
      >
        {showCheckbox && (
          <div 
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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
          <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-neutral-700 group-hover:border-purple-500 transition-colors ${
            isGroup ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-purple-600 to-amber-600'
          }`}>
            {avatarContent}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate text-sm">{displayName}</h3>
          <p className="text-neutral-400 text-xs truncate">{username}</p>
          {subtitle && (
            <p className="text-neutral-500 text-xs mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        
        {!showCheckbox && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (activeTab === 'search' && searchResults.length === 0 && searchTerm) {
      return (
        <div className="text-center py-8 text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No users found for "{searchTerm}"</p>
        </div>
      );
    }

    if (activeTab === 'search' && searchResults.length > 0) {
      return (
        <div className="space-y-3 w-full pb-15">
          <p className="text-neutral-400 text-xs mb-3">
            Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
          </p>
          {searchResults.map((user, index) => (
            <Link 
              key={user._id || index}
              to={`/messages/${encodeURIComponent(user?.username)}`}
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
              className='flex gap-3 w-full'
            >
              <UserCard user={group} isGroup={true} />
            </Link>
          ))}
        </div>
      );
    }

    // Empty states
    if (activeTab === 'contacts' && contacts.length === 0) {
      return (
        <div className="text-center py-8 text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm">No contacts yet</p>
          <p className="text-xs mt-1">Start conversations with people you know</p>
        </div>
      );
    }

    if (activeTab === 'groups' && groups.length === 0) {
      return (
        <div className="text-center py-8 text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm">No groups yet</p>
          <p className="text-xs mt-1">Create a group to start chatting with multiple people</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGroupModal(true)}
            className="mt-3 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-medium text-sm"
          >
            Create Your First Group
          </motion.button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="pb-20">
      <div className="sticky top-0 z-10 bg-neutral-900 pt-2 pb-3 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGroupModal(true)}
            className="py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-medium flex items-center gap-1 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Group
          </motion.button>
        </div>
        
        <SearchInput 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
          onClearSearch={clearSearch} 
          open={true} 
        />
        
        {/* Navigation Tabs */}
        <div className="flex mt-3 bg-neutral-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'contacts' 
                ? 'bg-purple-600 text-white' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Contacts
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
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
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'search' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Search
            </button>
          )}
        </div>
      </div>
      
      <div className="px-4 mt-3">
        {/* Content Area */}
        {renderContent()}
      </div>

      {/* Group Creation Modal for Mobile */}
      <AnimatePresence>
        {showGroupModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-2 sm:items-center sm:p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-neutral-800 rounded-2xl p-5 w-full max-w-md border border-neutral-700 shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Create Group Chat</h3>
                <button 
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedMembers([]);
                    setCreateError(null);
                    setModalSearchTerm("");
                    setModalSearchResults([]);
                  }}
                  className="text-neutral-400 hover:text-white transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {createError && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                  {createError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-neutral-300 text-xs font-medium mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Enter group name"
                />
              </div>
              
              <div className="mb-4 flex-1 overflow-hidden flex flex-col">
                <label className="block text-neutral-300 text-xs font-medium mb-1">
                  Select Members ({selectedMembers.length})
                </label>
                
                {/* Search input in modal */}
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Search for users to add..."
                  />
                  {modalSearchTerm && (
                    <button
                      onClick={() => setModalSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-neutral-400 hover:text-white transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="max-h-40 overflow-y-auto bg-neutral-700 rounded-lg p-2 flex-1">
                  {isModalSearching ? (
                    <div className="flex justify-center items-center py-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : modalSearchTerm && modalSearchResults.length > 0 ? (
                    // Show search results when searching
                    modalSearchResults.map(user => (
                      <div 
                        key={user._id} 
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
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
                    // Show contacts when not searching
                    contacts.map(contact => (
                      <div 
                        key={contact._id} 
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
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
                    <p className="text-neutral-400 text-center py-4 text-xs">No contacts available</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setGroupName("");
                    setSelectedMembers([]);
                    setCreateError(null);
                    setModalSearchTerm("");
                    setModalSearchResults([]);
                  }}
                  className="flex-1 py-2 px-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center"
                >
                  {isCreatingGroup ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-1"></div>
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileContact