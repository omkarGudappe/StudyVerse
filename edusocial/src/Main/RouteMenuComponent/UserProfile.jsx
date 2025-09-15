import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Socket from "../../SocketConnection/Socket";
import { auth } from "../../Auth/AuthProviders/FirebaseSDK";
import { UserDataContextExport } from "./CurrentUserContexProvider";
import UserPosts from './Panels/UserPosts';


const UserProfile = () => {
  const { userName } = useParams();
  const [UserProfileData, setUserProfileData] = useState(null);
  const [Peer, setPeer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [PeeredCount , setPeeredCount] = useState(0)
  const { ProfileData } = UserDataContextExport();
  const [CheackPeer, setCheackPeer] = useState(false);
  const [NotesLength , setNotesLength] = useState(0)


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
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error(err?.response?.data?.message);
        setError(err?.response?.data?.message);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };
    FetchUser();
  }, [userName]);

  useEffect(() => {
      if (ProfileData?.MyConnections?.includes(UserProfileData?._id)) {
        setCheackPeer(true);
        setPeer(false);
      }
      setPeeredCount(UserProfileData?.connections.length)
      console.log("Check ", ProfileData?.connections?.includes(UserProfileData?._id));
    }, [UserProfileData, ProfileData]);

  const Education = UserProfileData?.education?.split(",") || [];

  const handleSocketConnection = () => {
    if(auth.currentUser){
      const FromID = ProfileData?._id;
      console.log(ProfileData);
      Socket.emit("SendRequest", { Id: UserProfileData?._id , fromID: FromID });
      setCheackPeer(true);
      setPeer(true);
    }
  };

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
    <div className="min-h-screen bg-neutral-950 text-amber-100 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg">
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
            <p className="text-gray-300 leading-relaxed">
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
                  <h3 className="font-medium">
                    {Education[0] || "Not specified"}
                  </h3>
                  <p className="text-sm text-gray-400">{Education[1] || ""}</p>
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
                  <h3 className="font-medium">
                    {Education[2] || "Not specified"}
                  </h3>
                  <p className="text-sm text-gray-400">{Education[3] || ""}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-neutral-900 p-6 rounded-2xl h-auto md:max-h-90 shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0">
              <img
                src={
                  UserProfileData?.UserProfile?.avatar?.url ||
                  "https://via.placeholder.com/150"
                }
                alt="profile"
                className="rounded-full h-full w-full object-cover border-4 border-purple-700/30"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <div className="flex justify-center md:justify-start items-center">
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {UserProfileData?.firstName || "User"}{" "}
                    {UserProfileData?.lastName || "Name"}
                  </h1>
                  <div className="px-5 w-auto absolute top-5 right-0">
                    {!CheackPeer ?(<button
                      onClick={handleSocketConnection}
                      className="p-2 px-5 bg-blue-600 cursor-pointer active:scale-95 text-center w-full rounded-2xl"
                    >
                      Peer
                    </button>) : !Peer ? (
                      <button
                        className="p-2 px-5 bg- cursor-pointer text-center w-full rounded-2xl"
                      >
                        Peered
                      </button>
                      ) : (
                        <button 
                        className="p-1 bg-gray-900 cursor-pointer active:scale-95 text-center w-full rounded-2xl"
                        onClick={() => setPeer(false)}
                        disabled
                      >
                        Requested
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-purple-400 italic">
                  {UserProfileData?.username || "username"}
                </p>
                <p className="text-gray-400">
                  {Education[0] || ""} {Education[1] || ""}
                </p>
              </div>

              <p className="text-gray-300 mb-6 line-clamp-2">
                {UserProfileData?.UserProfile?.heading || "No heading available."}
              </p>

              <div className="grid grid-cols-3 gap-4 border-t border-neutral-700 pt-4">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{NotesLength}</span>
                  <p className="text-sm text-gray-400">Notes sent</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{PeeredCount}</span>
                  <p className="text-sm text-gray-400">Peers</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">0</span>
                  <p className="text-sm text-gray-400">Peers Network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='border-t-2 mt-30 border-neutral-600'>
        <UserPosts userId={UserProfileData?._id} getPostLength={(value) => setNotesLength(value)} />
      </div>
    </div>
  );
};

export default UserProfile;
