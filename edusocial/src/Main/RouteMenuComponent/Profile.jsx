import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { auth } from '../../Auth/AuthProviders/FirebaseSDK'
import { Link } from 'react-router-dom';
import { UserDataContextExport } from './CurrentUserContexProvider';
import UserPosts from './Panels/UserPosts';
import OpenPeersModel from "./Panels/OpenPeersModel";

const Profile = () => {
  const [UserProfileData, setUserProfileData] = useState(null);
  const [FirebaseUid, setFirebaseUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [PeeredCount , setPeeredCount] = useState(0)
  const [MyPeeredCount , setMyPeeredCount] = useState(0);
  const { ProfileData } = UserDataContextExport();
  const [NotesLength , setNotesLength] = useState(0)
  const [OpenPeerConnectionsModel , setOpenPeerConnectionsModel] = useState(false);


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setFirebaseUid(user.uid);
      } else {
        setFirebaseUid(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!FirebaseUid) return;
    
    const FetchDataFromBackEnd = async () => {
      try {
        setLoading(true);
        if(ProfileData){
          setUserProfileData(ProfileData);
        }else{
          const FetchUserProfileData = await axios.get(`${import.meta.env.VITE_API_URL}/user/profile/${FirebaseUid}`);
          setUserProfileData(FetchUserProfileData.data.userProfile);
        }
        setError(null);
      } catch (err) {
        console.log(err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    FetchDataFromBackEnd();
  }, [FirebaseUid , ProfileData]);

  useEffect(() => {
    setPeeredCount(UserProfileData?.connections?.length);
    setMyPeeredCount(UserProfileData?.MyConnections?.length);
  }, [UserProfileData])

  // const Education = UserProfileData?.education?.split(',') || [];
  console.log("For cheking education ", UserProfileData);

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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    <div className="min-h-screen relative bg-neutral-950 text-amber-100 py-8 px-4 md:px-8 flex flex-col justify-between">
      <div className="fixed top-4 right-4 z-10 flex flex-col gap-3 md:flex-row md:gap-4">
        <Link to='/challenges' className="bg-gradient-to-r from-purple-600 to-amber-500 rounded-full h-12 w-12 flex justify-center items-center hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
              width="24" height="24" fill="none" stroke="currentColor"
              strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
              className="text-white">
            <rect x="4" y="3" width="12" height="18" rx="2"/>
            <path d="M8 3v2"/>
            <path d="M12 3v2"/>
            <line x1="7" y1="9" x2="13" y2="9"/>
            <line x1="7" y1="12" x2="13" y2="12"/>
            <line x1="7" y1="15" x2="11" y2="15"/>
            <circle cx="18.5" cy="17.5" r="3.0"/>
            <path d="M18.5 16v2l1 0.6"/>
          </svg>
        </Link>
        
        <Link title='Update Profile' to='/setting/update-profile' className="bg-neutral-800 rounded-full h-12 w-12 flex justify-center items-center hover:bg-neutral-700 transition-all duration-300 transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" className='h-5' fill="#fff" viewBox="0 0 640 640">
            <path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z"/>
          </svg>
        </Link>
        
        <Link to='/settings' title='Setting' className="bg-neutral-800 rounded-full h-12 w-12 flex justify-center items-center hover:bg-neutral-700 transition-all duration-300 transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="#fff" className="h-5">
            <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
          </svg>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">About Me</h1>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10 text-purple-500" viewBox="0 0 640 640">
              <path fill="currentColor" d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z"/>
            </svg>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              {UserProfileData?.UserProfile?.description || "No description available."}
            </p>
            
            <div className="space-y-3 pt-4 border-t border-neutral-700">
              <div className="flex items-center gap-4">
                <div className="bg-purple-900/30 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-4 9 4-9 4-9-4z"/>
                    <path d="M7 11v3c0 1.1 2.7 2 5 2s5-.9 5-2v-3"/>
                    <path d="M21 9v3"/>
                    <circle cx="7" cy="17.5" r="2.5"/>
                    <path d="M7 16v1.2l.9.6"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">{UserProfileData?.education?.standard ? `${UserProfileData?.education?.standard}st` : UserProfileData?.education?.degree} <sup>{UserProfileData?.education?.stream ? UserProfileData?.education?.stream : UserProfileData?.education?.currentYear ? `${UserProfileData?.education?.currentYear} Year`  : ""}</sup></h3>
                  <p className="text-sm text-gray-400">{UserProfileData?.education?.stream ? UserProfileData?.education?.stream : UserProfileData?.education?.field ? UserProfileData?.education?.field : ""}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-purple-900/30 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 text-purple-400" viewBox="0 0 640 640">
                    <path fill="currentColor" d="M335.9 84.2C326.1 78.6 314 78.6 304.1 84.2L80.1 212.2C67.5 219.4 61.3 234.2 65 248.2C68.7 262.2 81.5 272 96 272L128 272L128 480L128 480L76.8 518.4C68.7 524.4 64 533.9 64 544C64 561.7 78.3 576 96 576L544 576C561.7 576 576 561.7 576 544C576 533.9 571.3 524.4 563.2 518.4L512 480L512 272L544 272C558.5 272 571.2 262.2 574.9 248.2C578.6 234.2 572.4 219.4 559.8 212.2L335.8 84.2zM464 272L464 480L400 480L400 272L464 272zM352 272L352 480L288 480L288 272L352 272zM240 272L240 480L176 480L176 272L240 272zM320 160C337.7 160 352 174.3 352 192C352 209.7 337.7 224 320 224C302.3 224 288 209.7 288 192C288 174.3 302.3 160 320 160z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">{UserProfileData?.education?.institute || "Not specified"}</h3>
                  {/* <p className="text-sm text-gray-400">{UserProfileData?.UserProfile?.education?.stream || ""}</p> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 p-6 rounded-2xl h-auto md:max-h-90 shadow-lg relative">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-32 h-32 md:w-36 md:h-36 flex-shrink-0">
              <img 
                src={UserProfileData?.UserProfile?.avatar?.url || "https://via.placeholder.com/150"} 
                alt="profile" 
                className="rounded-full h-full w-full object-cover border-4 border-purple-700/30" 
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <div className='flex justify-center md:justify-start items-center'>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {UserProfileData?.firstName || "User"} {UserProfileData?.lastName || "Name"}
                  </h1>
                </div>
                <p className="text-purple-400 italic">
                  {UserProfileData?.username || "username"}
                </p>
                <p className="text-gray-400">{UserProfileData?.education?.standard ? `${UserProfileData?.education?.standard}st` : UserProfileData?.education?.degree} <sup>{UserProfileData?.education?.stream ? UserProfileData?.education?.stream : UserProfileData?.education?.currentYear ? `${UserProfileData?.education?.currentYear} Year`  : ""}</sup></p>
              </div>
              
              <p className="text-gray-300 mb-6 line-clamp-2">
                {UserProfileData?.UserProfile?.heading || "No heading available."}
              </p>
              
              <div className="grid grid-cols-3 gap-4 border-t border-neutral-700 pt-4">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{NotesLength}</span>
                  <p className="text-sm text-gray-400">Notes sent</p>
                </div>
                <div onClick={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} className="flex cursor-pointer flex-col items-center">
                  <span className="text-xl font-bold">{MyPeeredCount}</span>
                  <p className="text-sm text-gray-400">Peers</p>
                </div>
                <div onClick={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} className="flex cursor-pointer flex-col items-center">
                  <span className="text-xl font-bold">{PeeredCount}</span>
                  <p className="text-sm text-gray-400">Peers Network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className=''>
        <UserPosts userId={ProfileData?._id} getPostLength={(value) => setNotesLength(value)} />
      </div>
       { OpenPeerConnectionsModel && <OpenPeersModel open={OpenPeerConnectionsModel} from='CurrentUser' onClose={() => setOpenPeerConnectionsModel(!OpenPeerConnectionsModel)} ProfileData={UserProfileData} currentUserData={ProfileData} />}

    </div>
  )
}

export default Profile