import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { UserDataContextExport } from "./CurrentUserContexProvider";
import UserPosts from './Panels/UserPosts';
import OpenPeersModel from "./Panels/OpenPeersModel";
import PeerButtonManage from "./SmallComponents/PeerButtonManage";

const UserProfile = () => {
  const { userName } = useParams();
  const [UserProfileData, setUserProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [PeeredCount, setPeeredCount] = useState(0);
  const [PeerNetworkCount, setPeerNetworkCount] = useState(0);
  const { ProfileData } = UserDataContextExport();
  const [NotesLength, setNotesLength] = useState(0);
  const [OpenPeerConnectionsModel, setOpenPeerConnectionsModel] = useState(false);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!userName) return;

    const FetchUser = async () => {
      setLoading(true);
      try {
        const Res = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/friend/username/${userName}`
        );
        const result = await Res.data;
        if (result.ok) {
          setUserProfileData(result.user);
          
          // Check if account is private
          const isPrivate = result.user.setting?.accountType === "private";
          setIsPrivateAccount(isPrivate);
          
          // Check if current user has access to private account
          if (isPrivate) {
            const hasPeerAccess = result.user.connections?.includes(ProfileData?._id);
            setHasAccess(hasPeerAccess || result.user._id === ProfileData?._id);
          } else {
            setHasAccess(true);
          }
        }
      } catch (err) {
        console.error(err?.response?.data?.message);
        setError(err?.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    FetchUser();
  }, [userName, ProfileData]);

  useEffect(() => {
    if (UserProfileData) {
      setPeeredCount(UserProfileData?.MyConnections?.length || 0);
      setPeerNetworkCount(UserProfileData?.connections?.length || 0);
    }
  }, [UserProfileData]);

  // const Education = UserProfileData?.education?.split(",") || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-amber-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-amber-100 flex items-center justify-center">
        <div className="text-center p-6 bg-neutral-900 rounded-2xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-red-500 mx-auto mb-4"
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
          <p className="text-xl">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 cursor-pointer active:scale-95 px-4 py-2 bg-purple-700 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen select-none bg-neutral-950 text-amber-100 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-2xl shadow-lg mb-6 border border-neutral-700/50">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0">
                <img
                  src={
                    UserProfileData?.UserProfile?.avatar?.url ||
                    "https://via.placeholder.com/150"
                  }
                  alt="profile"
                  className={`rounded-full h-full w-full object-cover border-4 ${isPrivateAccount && !hasAccess ? 'border-purple-500/50 blur-sm' : 'border-purple-700/30'}`}
                />
              </div>
              {isPrivateAccount && !hasAccess && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-purple-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <div className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-2">
                  <h1 className={`text-2xl md:text-3xl font-bold ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>
                    {UserProfileData?.firstName || "User"}{" "}
                    {UserProfileData?.lastName || "Name"}
                  </h1>
                  <div className="px-2">
                    <PeerButtonManage 
                      className='rounded-xl px-4 py-2 bg-purple-700 hover:bg-purple-600 transition-colors' 
                      currentUser={ProfileData?._id} 
                      OtherUser={UserProfileData?._id} 
                    />
                  </div>
                </div>
                <p className={`text-purple-400 italic ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>
                  {UserProfileData?.username || "username"}
                </p>
                <p className={`text-gray-400 ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>
                <p className="text-gray-400">{UserProfileData?.education?.standard || UserProfileData?.education?.degree} <sup>{UserProfileData?.education?.stream || `${UserProfileData?.education?.currentYear} Year`  || ""}</sup></p>
                </p>
              </div>

              <p className={`text-gray-300 mb-6 line-clamp-2 ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>
                {UserProfileData?.UserProfile?.heading || "No heading available."}
              </p>

              <div className="grid grid-cols-3 gap-4 border-t border-neutral-700 pt-4">
                <div className="flex flex-col items-center">
                  <span className={`text-xl font-bold ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>{NotesLength}</span>
                  <p className="text-sm text-gray-400">Notes</p>
                </div>
                <div onClick={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} className="flex cursor-pointer flex-col items-center">
                  <span className={`text-xl font-bold ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>{PeeredCount}</span>
                  <p className="text-sm text-gray-400">Peers</p>
                </div>
                <div onClick={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} className="flex cursor-pointer flex-col items-center">
                  <span className={`text-xl font-bold ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>{PeerNetworkCount}</span>
                  <p className="text-sm text-gray-400">Network</p>
                </div>
              </div>
            </div>
          </div>
          
          {isPrivateAccount && !hasAccess && (
            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-purple-500 mb-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-xl font-bold mb-2">Private Account</h2>
              <p className="text-gray-400 text-center mb-4 max-w-md">
                This account is private. Connect with this user to view their full profile and content.
              </p>
              <PeerButtonManage 
                className="rounded-xl px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 transition-all duration-300 shadow-lg shadow-purple-500/20" 
                currentUser={ProfileData?._id} 
                OtherUser={UserProfileData?._id} 
              />
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* About Me Section */}
          <div className={`bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-2xl shadow-lg border border-neutral-700/50 ${isPrivateAccount && !hasAccess ? 'relative overflow-hidden' : ''}`}>
            {isPrivateAccount && !hasAccess && (
              <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm rounded-2xl z-10"></div>
            )}
            
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">About Me</h1>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 md:w-10 md:h-10 text-purple-500"
                viewBox="0 0 640 640"
              >
                <path
                  fill="currentColor"
                  d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"
                />
              </svg>
            </div>

            <div className="space-y-4">
              <p className={`text-gray-300 leading-relaxed ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>
                {UserProfileData?.UserProfile?.description ||
                  "No description available."}
              </p>

              <div className="space-y-3 pt-4 border-t border-neutral-700">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-900/30 p-2 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-7 md:w-7 text-purple-400"
                      viewBox="0 0 24 24"
                      fill="none" 
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9l9-4 9 4-9 4-9-4z" />
                      <path d="M7 11v3c0 1.1 2.7 2 5 2s5-.9 5-2v-3" />
                      <path d="M21 9v3" />
                      <circle cx="7" cy="17.5" r="2.5" />
                      <path d="M7 16v1.2l.9.6" />
                    </svg>
                  </div>
                  <div>
                   <h3 className="font-medium">{UserProfileData?.education?.standard || UserProfileData?.education?.degree || "Not specified"}</h3>

                  <p className="text-sm text-gray-400">{UserProfileData?.education?.stream || UserProfileData?.education?.field || ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-purple-900/30 p-2 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 md:h-7 md:w-7 text-purple-400"
                      viewBox="0 0 640 640"
                    >
                      <path
                        fill="currentColor"
                        d="M335.9 84.2C326.1 78.6 314 78.6 304.1 84.2L80.1 212.2C67.5 219.4 61.3 234.2 65 248.2C68.7 262.2 81.5 272 96 272L128 272L128 480L128 480L76.8 518.4C68.7 524.4 64 533.9 64 544C64 561.7 78.3 576 96 576L544 576C561.7 576 576 561.7 576 544C576 533.9 571.3 524.4 563.2 518.4L512 480L512 272L544 272C558.5 272 571.2 262.2 574.9 248.2C578.6 234.2 572.4 219.4 559.8 212.2L335.8 84.2zM464 272L464 480L400 480L400 272L464 272zM352 272L352 480L288 480L288 272L352 272zM240 272L240 480L176 480L176 272L240 272zM320 160C337.7 160 352 174.3 352 192C352 209.7 337.7 224 320 224C302.3 224 288 209.7 288 192C288 174.3 302.3 160 320 160z"
                      />
                    </svg>
                  </div>
                  <div>
                   <h3 className="font-medium">{UserProfileData?.education?.institute || "Not specified"}</h3>
                    {/* <p className={`text-sm text-gray-400 ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>{Education[3] || ""}</p> */}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-2xl shadow-lg border border-neutral-700/50">
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">Profile Stats</h1>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-400"
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
                  <h3 className="font-medium">Notes</h3>
                </div>
                <p className={`text-2xl font-bold pl-11 ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>{NotesLength}</p>
              </div>
              
              <div 
                onClick={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} 
                className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/30 cursor-pointer hover:bg-neutral-800/70 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-medium">Peers</h3>
                </div>
                <p className={`text-2xl font-bold pl-11 ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>{PeeredCount}</p>
              </div>
              
              <div 
                onClick={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} 
                className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/30 cursor-pointer hover:bg-neutral-800/70 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-400"
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
                  </div>
                  <h3 className="font-medium">Network</h3>
                </div>
                <p className={`text-2xl font-bold pl-11 ${isPrivateAccount && !hasAccess ? 'blur-sm' : ''}`}>{PeerNetworkCount}</p>
              </div>
              
              <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-900/30 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-400"
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
                  </div>
                  <h3 className="font-medium">Status</h3>
                </div>
                <p className={`text-sm font-medium pl-11 ${isPrivateAccount && !hasAccess ? 'text-purple-400' : 'text-green-400'}`}>
                  {isPrivateAccount && !hasAccess ? 'Private Account' : 'Public Account'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-8">
          <UserPosts 
            userId={UserProfileData?._id} 
            getPostLength={(value) => setNotesLength(value)} 
            isPrivate={isPrivateAccount && !hasAccess}
          />
        </div>
      </div>
      
      {OpenPeerConnectionsModel && (
        <OpenPeersModel 
          open={OpenPeerConnectionsModel} 
          from='OtherUser' 
          onClose={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} 
          ProfileData={UserProfileData} 
          currentUserData={ProfileData} 
        />
      )}
    </div>
  );
};

export default UserProfile;