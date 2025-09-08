import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../../Auth/AuthProviders/FirebaseSDK";

const ProfileBio = () => {
  const [previewImage, setPreviewImage] = useState(null);
  const [Loading, setLoading] = useState(false);
  const [error , setError] = useState({Error: "" , code: ""});
  const [ProfileData , setProfileData] = useState({
    bio: "",
    image: "",
    username: "",
  })
  const Navigate = useNavigate();

  const handlePreviewImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextCount = (e) => {
    const textLength = e.target.value.length;
    const remainingChars = 200 - textLength;
    document.getElementById("charCount").innerText = remainingChars;
  };


  const handleChange = (e) => {
    if(e.target.name === 'image') {
      setProfileData((prev) => ({...prev , [e.target.name]: e.target.files[0]}));
    } else {
      setProfileData((prev) => ({...prev , [e.target.name]: e.target.value}));
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const Fid = auth.currentUser.uid;
    console.log(ProfileData, Fid);
    if (!ProfileData.image || !ProfileData.bio || !Fid || !ProfileData.username) {
       alert("Please fill all fields and select an image.");
       return;
   }
    try{
        setLoading(true);
        const UserName = "@" + ProfileData.username;
        const formData = new FormData();
        formData.append("bio" , ProfileData.bio);
        formData.append("image", ProfileData.image);
        formData.append("username" , UserName);
        formData.append("FUid" , Fid);

        const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/profile`, formData);

        const result = await res.data;
        console.log("result:" , result)
        if(result){
            setLoading(false);
            setProfileData({
              bio: "",
              image: "",
              username: "",
            });
            setPreviewImage(null);
            Navigate('/home');
        }else{
            setError({Error: result.message || "An error occurred while uploading profile data", code: result.code || "UPLOAD_ERROR"});
            console.log(result);
            throw new Error(result);
        }
    }catch (err) {
      let msg = "An error occurred while uploading profile data";
      let code = "UPLOAD_ERROR";
      if (err.response && err.response.data) {
        if (typeof err.response.data === "object") {
          msg = err.response.data.message || msg;
          code = err.response.data.code || code;
        } else {
          msg = err.response.data;
        }
      } else if (err.message) {
        msg = err.message;
      }
      setError({ Error: msg, code });
    }finally{
        setLoading(false);
    }
  }

  return (
    <div className="bg-neutral-900 text-white h-screen flex items-center justify-center px-3">
      <div className="border-white border rounded-xl shadow-2xl shadow-gray-800 h-auto w-auto py-5 p-5 max-w-md">
        <div className="flex flex-col gap-y-3 mt-3 items-center justify-center ">
          <h1>Student Profile </h1>
          <div className="flex flex-col gap-y-2 items-center justify-center">
            <label
              htmlFor="profileImage"
              className="h-25 w-25 rounded-full border cursor-pointer flex items-center justify-center border-white"
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-12 h-12"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-labelledby="titlePlus"
                  role="img"
                >
                  <title id="titlePlus">Plus</title>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </label>
            <input
              onChange={(e) => {handlePreviewImage(e); handleChange(e);}}
              type="file"
              name="image"
              accept="image/*"
              id="profileImage"
              className="hidden"

            />
            Upload Profile Image
            <div className="relative flex gap-2 flex-col">
              <label htmlFor="bio" className="mt-4">
                Enter Your Bio
              </label>
              <textarea
                value={ProfileData.bio}
                onChange={(e) => {handleTextCount(e); handleChange(e);}}
                name="bio"
                id="bio"
                rows="10"
                cols={30}
                maxLength={200}
                className="w-full resize-none h-12 p-2 border focus:border-indigo-500 focus:ring-indigo-500 outline-none duration-200 border-white rounded-md"
                placeholder="Profile Description"
              ></textarea>
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                <span id="charCount">
                  {200 - (document.getElementById("bio")?.value.length || 0)}
                </span>
              </div>
            </div>
            <div className="w-full pt-2 relative">
              <input 
                className={`w-full p-2 border pl-8 ${error.code === 'USERNAME_TAKEN' ? 'border-red-500' : 'border-white'} focus:border-indigo-500 focus:ring-indigo-500 outline-none duration-200 rounded-md`}
                type="text" 
                placeholder="Enter Unique Username"
                name="username" 
                id="username"
                value={ProfileData.username}
                onChange={(e) => handleChange(e)}
              />
              <p className="absolute top-3 left-2 text-xl text-gray-400 ">@</p>
            </div>
            {error.Error && (
              <p className="text-red-500">{error.Error}</p>
            )}
            <div className="flex gap-5 mt-5 w-full justify-between px-3">
              <button onClick={handleSubmit} className="bg-blue-500 text-white cursor-pointer px-4 py-2 active:scale-95 rounded-md w-1/2">
                {Loading ? (
                    <div className="flex items-center justify-center">
                        <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            ></circle>
                            <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                      Uploading..
                    </div>
                ) : "Set Profile"}
                
              </button>
              <button className="bg-gray-500 text-white cursor-pointer active:scale-95  px-4 py-2 rounded-md w-1/2">
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBio;
