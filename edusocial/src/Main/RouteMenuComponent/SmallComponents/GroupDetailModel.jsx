import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaUsers, FaUser, FaCrown, FaCamera, FaSearch, FaPhone, FaVideo, FaEllipsisV, FaSignOutAlt, FaVolumeMute, FaBell, FaBellSlash, FaUserPlus, FaTrash, FaEdit, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import axios from 'axios';
import Socket from '../../../SocketConnection/Socket';
import { useNavigate } from 'react-router-dom';

const GroupDetailModel = ({ groupId, GroupData, onClose, currentUser, UpdateGroupData }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [groupName, setGroupName] = useState(GroupData?.name || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('members');
  const [notifications, setNotifications] = useState(true);
  const [muted, setMuted] = useState(false);
  const [getChanged, setGetChanged] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const navigate = useNavigate();
  const [MenuBtn, setMenuBtn] = useState({});
  
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [addMembersSearchTerm, setAddMembersSearchTerm] = useState('');
  const [addMembersSearchResults, setAddMembersSearchResults] = useState([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const showError = (message) => {
    setError(message);
    setSuccess(null);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setError(null);
  };

  const handleUpdateGroupDetail = async () => {
    if (!getChanged) return;

    const form = new FormData();
    if (uploadingFile) {
      form.append('avatar', uploadingFile);
    }
    if (groupName && groupName !== GroupData.name) {
      form.append('name', groupName);
    }

      form.append('currentUserId', currentUser._id);

    try {
      setUploading(true);
      setLoading(true);
      const token = localStorage.getItem('token'); 
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/group/${groupId}/update`,
        form,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data' ,
            'Authorization': `Bearer ${token}`,
          },          
        }
      );

      if (response.data.ok) {
        setGetChanged(false);
        UpdateGroupData(response.data.group);
        showSuccess('Group details updated successfully!');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update group details';
      showError(errorMessage);
      console.error('Error updating group details:', err);
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

 const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showError('Image size should be less than 5MB');
      return;
    }

    setPreviewImage(URL.createObjectURL(file));
    setGetChanged(true);
    setUploadingFile(file);
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token')
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/group/${groupId}/members/${memberId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        },
        { timeout: 5000 },
      );

      if (response.data.ok) {
        showSuccess('Member removed successfully!');
        const NewGroupData = { ...GroupData, members: GroupData.members.filter(member => member.member._id !== memberId) };
        UpdateGroupData(NewGroupData);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove member';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (id) => {
    try {
      setLoading(true);
      console.log("Making admin for user id: ", id);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/group/${groupId}/members/${id}/admin`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.ok) {
        showSuccess('User has been made admin');
        setLoading(false);
        const updatedMembers = GroupData.members.map(member => {
          if (member.member._id === id) {
            return { ...member, isAdmin: true };
          }
          return member;
        });
        const NewGroupData = { ...GroupData, members: updatedMembers };
        UpdateGroupData(NewGroupData);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to make admin';
      showError(errorMessage);
      console.error('Error making admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembersClick = () => {
    setShowAddMembersModal(true);
    setSelectedNewMembers([]);
    setAddMembersSearchTerm('');
    setAddMembersSearchResults([]);
  };

  const searchUsersForGroup = async (query) => {
    if (!query.trim()) {
      setAddMembersSearchResults([]);
      return;
    }

    try {
      setIsSearchingMembers(true);
      const token = localStorage.getItem('token');
      if(!token) {
        throw new Error('No auth token found');
      }
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/searchUser?query=${query}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
        const existingMemberIds = GroupData.members.map(member => member._id);
        const filteredUsers = response.data.users.filter(user => 
          !existingMemberIds.includes(user._id)
        );
        setAddMembersSearchResults(filteredUsers);
        console.log("identifying the Result" , filteredUsers, "and", response?.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setAddMembersSearchResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchUsersForGroup(addMembersSearchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [addMembersSearchTerm]);

useEffect(() => {
  function handleClickOutside(e) {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target) &&
      btnRef.current &&
      !btnRef.current.contains(e.target)
    ) {
      setMenuBtn({});
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  const toggleMemberSelection = (user) => {
    if (selectedNewMembers.some(member => member._id === user._id)) {
      setSelectedNewMembers(selectedNewMembers.filter(member => member._id !== user._id));
    } else {
      setSelectedNewMembers([...selectedNewMembers, user]);
    }
  };

  const addMembersToGroup = async () => {
    if (selectedNewMembers.length === 0) {
      showError('Please select at least one member to add');
      return;
    }

    try {
      setAddingMembers(true);
      const token = localStorage.getItem('token');
      const memberIds = selectedNewMembers.map(member => member._id);

      console.log("members Ids", memberIds);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/group/${groupId}/members`,
        { memberIds },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.ok) {
        showSuccess(`${selectedNewMembers.length} member(s) added successfully!`);
        setShowAddMembersModal(false);
        setSelectedNewMembers([]);
        setAddMembersSearchTerm('');
        setAddMembersSearchResults([]);

        UpdateGroupData(response.data.group);
        Socket.emit("SendContactUsers", { ID: currentUser?._id });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add members';
      showError(errorMessage);
      console.error('Error adding members:', error);
    } finally {
      setAddingMembers(false);
    }
  };

  const leaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group? This action cannot be undone.')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/group/${groupId}/leave`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.ok) {
        showSuccess('You have left the group');
        setTimeout(() => navigate(-1), 1000);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to leave group';
      showError(errorMessage);
      console.error('Error leaving group:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = GroupData?.members?.filter(member =>
    `${member.firstName} ${member.lastName} ${member.username}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  console.log("filter data", filteredMembers);
  const isGroupAdmin = (memberId) => {
    return GroupData?.members?.some(member => member.member._id === memberId && member.isAdmin);
  };

  const isCurrentUserAdmin = isGroupAdmin(currentUser?._id);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // User Card Component for Add Members Modal
  const UserCard = ({ user, showCheckbox = false, isSelected = false, onSelect }) => {
    const displayName = `${user.firstName} ${user.lastName}`;
    
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
          isSelected ? 'bg-purple-600/20 border border-purple-500/50' : 'bg-neutral-800/50 hover:bg-neutral-800'
        }`}
        onClick={onSelect}
      >
        {showCheckbox && (
          <div 
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isSelected ? 'bg-purple-500 border-purple-500' : 'border-neutral-500'
            }`}
          >
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
        
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user.UserProfile?.avatar?.url ? (
            <img
              src={user.UserProfile.avatar.url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{displayName}</h3>
          <p className="text-neutral-400 text-sm truncate">{user.username}</p>
          {user.education && (
            <p className="text-neutral-500 text-xs mt-1 truncate">
              {user.education.standard || user.education.degree}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (!GroupData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="flex flex-col items-center justify-center w-full max-w-2xl">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md mb-4 bg-red-500/20 border z-60 border-red-500/50 rounded-xl p-4 flex items-center gap-3"
              >
                <FaExclamationTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-200 text-sm flex-1">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
                  <FaTimes className="h-4 w-4" />
                </button>
              </motion.div>
            )}
            
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-md mb-4 bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3"
              >
                <FaCheck className="h-5 w-5 text-green-400 flex-shrink-0" />
                <p className="text-green-200 text-sm flex-1">{success}</p>
                <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-300">
                  <FaTimes className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="bg-neutral-900 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden border border-neutral-700 shadow-2xl"
          >
            <div className="p-6 border-b border-neutral-700 bg-gradient-to-r from-neutral-800 to-neutral-900 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Group Info</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-neutral-700 rounded-full transition-colors"
                    disabled={loading}
                  >
                    <FaTimes className="h-4 w-4 text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <p className="text-white text-sm">Processing...</p>
                </div>
              </div>
            )}

            <div className="overflow-y-auto no-scrollbar lenis max-h-[calc(85vh-120px)] scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              <div className="relative p-6 border-b border-neutral-700">
                <div className="flex flex-col items-center text-center">
                  <div className="relative group mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          className="h-full w-full object-cover" 
                          alt="Preview" 
                        />
                      ) : GroupData.avatar ? (
                        <img
                          src={GroupData.avatar}
                          alt={GroupData.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-white font-bold text-3xl">
                          {GroupData.name?.[0]}{GroupData.name?.[1] || ''}
                        </span>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    {isCurrentUserAdmin && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 bg-neutral-800 p-2 rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity border border-neutral-600"
                        disabled={loading}
                      >
                        <FaCamera className="h-3 w-3 text-white" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
                    {editingName ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={groupName}
                        onChange={(e) => { setGroupName(e.target.value); setGetChanged(true); }}
                        className="bg-neutral-800 text-2xl font-bold text-white text-center border-b border-purple-500 outline-none px-2 py-1 rounded max-w-full"
                        disabled={loading}
                        maxLength={50}
                      />
                    ) : (
                      <>
                        <h3 className="text-2xl font-bold text-white break-words max-w-full">{groupName}</h3>
                        {isCurrentUserAdmin && (
                          <button
                            onClick={() => setEditingName(true)}
                            className="p-2 hover:bg-neutral-700 rounded transition-colors flex-shrink-0"
                            disabled={loading}
                          >
                            <FaEdit className="h-4 w-4 text-neutral-400" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-neutral-400 text-sm">
                    Created by {GroupData.createdBy?.firstName} {GroupData.createdBy?.lastName} • {formatDate(GroupData.createdAt)}
                  </p>
                </div>
                {getChanged && (
                  <button 
                    onClick={handleUpdateGroupDetail}
                    disabled={uploading || loading}
                    className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 px-3 py-1 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {uploading ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>

              <div className="border-b border-neutral-700">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('members')}
                    disabled={loading}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${
                      activeTab === 'members'
                        ? 'text-purple-400 border-b-2 border-purple-400'
                        : 'text-neutral-400 hover:text-white disabled:hover:text-neutral-400'
                    }`}
                  >
                    Members ({GroupData?.members?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    disabled={loading}
                    className={`flex-1 py-4 text-center font-medium transition-colors ${
                      activeTab === 'settings'
                        ? 'text-purple-400 border-b-2 border-purple-400'
                        : 'text-neutral-400 hover:text-white disabled:hover:text-neutral-400'
                    }`}
                  >
                    Settings
                  </button>
                </div>
              </div>

              {activeTab === 'members' && (
                <div className="p-4">
                  <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                    {filteredMembers?.length === 0 ? (
                      <div className="text-center py-8 text-neutral-400">
                        {searchTerm ? 'No members found' : 'No members in group'}
                      </div>
                    ) : (
                      filteredMembers?.map((member) => (
                        <div
                          key={member?.member?._id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 transition-colors group"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                              {member?.member?.UserProfile?.avatar?.url ? (
                                <img
                                  src={member.member.UserProfile.avatar.url}
                                  alt={`${member.member.firstName} ${member.member.lastName}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-white font-semibold">
                                  {member?.member?.firstName?.[0]}{member?.member?.lastName?.[0]}
                                </span>
                              )}
                            </div>
                            {isGroupAdmin(member?.member._id) && (
                              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                                <FaCrown className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white font-medium truncate">
                                {member?.member?.firstName} {member?.member?.lastName}
                              </p>
                              {isGroupAdmin(member?.member?._id) && (
                                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="text-neutral-400 text-sm truncate">
                              {member?.member?.username}
                            </p>
                          </div>

                             {isCurrentUserAdmin && !isGroupAdmin(member?.member?._id) && (
                              <div className="relative inline-block">
                                <button
                                  ref={btnRef}
                                  onClick={() =>
                                    setMenuBtn(prev =>
                                      prev.memberId === member?.member?._id && prev.status
                                        ? {}
                                        : { status: true, memberId: member?.member?._id }
                                    )
                                  }
                                  className="p-2 hover:bg-neutral-500/20 rounded-full transition-all"
                                >
                                  ⋮
                                </button>

                                {MenuBtn.status && MenuBtn.memberId === member?.member?._id && (
                                  <div
                                    ref={dropdownRef}
                                    className="absolute top-10 right-0 bg-neutral-800 border border-neutral-700 rounded-xl shadow-lg z-20 flex flex-col min-w-[150px]"
                                  >
                                    <button
                                      onClick={() => removeMember(member?.member?._id)}
                                      className="p-2 hover:bg-red-500/20 flex items-center"
                                    >
                                      <FaTrash className="h-4 w-4 text-red-400" />
                                      <span className="ml-2 text-sm text-red-400">Remove</span>
                                    </button>
                                    <button
                                      onClick={() => makeAdmin(member?.member?._id)}
                                      className="p-2 hover:bg-yellow-500/20 flex items-center"
                                    >
                                      <FaCrown className="h-4 w-4 text-yellow-400" />
                                      <span className="ml-2 text-sm text-yellow-400">Make Admin</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-4 space-y-4">
                  <div className="bg-neutral-800 rounded-xl p-4">
                    <h4 className="text-white font-semibold mb-4">Group Management</h4>
                    <div className="space-y-2">
                      {isCurrentUserAdmin && (
                        <button 
                          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-neutral-700 transition-colors text-yellow-400 disabled:hover:bg-transparent"
                          disabled={loading}
                        >
                          <FaCrown className="h-5 w-5" />
                          <span>Admin Controls</span>
                        </button>
                      )}
                      <button 
                        onClick={handleAddMembersClick}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-neutral-700 transition-colors text-blue-400 disabled:hover:bg-transparent"
                        disabled={loading}
                      >
                        <FaUserPlus className="h-5 w-5" />
                        <span>Add Members</span>
                      </button>
                      <button
                        onClick={leaveGroup}
                        disabled={loading}
                        className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 disabled:hover:bg-transparent disabled:opacity-50"
                      >
                        <FaSignOutAlt className="h-5 w-5" />
                        <span>Leave Group</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showAddMembersModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-neutral-800 rounded-2xl p-6 max-w-md w-full border border-neutral-700 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Add Members to Group</h3>
                <button 
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setSelectedNewMembers([]);
                    setAddMembersSearchTerm('');
                    setAddMembersSearchResults([]);
                  }}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-neutral-300 text-sm font-medium mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                  <input
                    type="text"
                    value={addMembersSearchTerm}
                    onChange={(e) => setAddMembersSearchTerm(e.target.value)}
                    className="w-full bg-neutral-700 border border-neutral-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Search for users to add..."
                  />
                  {addMembersSearchTerm && (
                    <button
                      onClick={() => setAddMembersSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white transition-colors"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-neutral-300 text-sm font-medium">
                    Select Members ({selectedNewMembers.length})
                  </label>
                  {selectedNewMembers.length > 0 && (
                    <button
                      onClick={() => setSelectedNewMembers([])}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                
                <div className="max-h-48 overflow-y-auto bg-neutral-700 rounded-lg p-2 space-y-2">
                  {isSearchingMembers ? (
                    <div className="flex justify-center items-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                  ) : addMembersSearchResults.length > 0 ? (
                    addMembersSearchResults.map(user => (
                      <UserCard 
                        key={user._id}
                        user={user}
                        showCheckbox={true}
                        isSelected={selectedNewMembers.some(m => m._id === user._id)}
                        onSelect={() => toggleMemberSelection(user)}
                      />
                    ))
                  ) : addMembersSearchTerm ? (
                    <p className="text-neutral-400 text-center py-4">No users found</p>
                  ) : (
                    <p className="text-neutral-400 text-center py-4">Search for users to add to the group</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddMembersModal(false);
                    setSelectedNewMembers([]);
                    setAddMembersSearchTerm('');
                    setAddMembersSearchResults([]);
                  }}
                  className="flex-1 py-2 px-4 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMembersToGroup}
                  disabled={selectedNewMembers.length === 0 || addingMembers}
                  className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center"
                >
                  {addingMembers ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    `Add ${selectedNewMembers.length} Member${selectedNewMembers.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}

export default GroupDetailModel