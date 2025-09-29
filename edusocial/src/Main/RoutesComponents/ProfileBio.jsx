import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../../Auth/AuthProviders/FirebaseSDK";

const ProfileBio = () => {
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ message: "", code: "", type: "" });
  const [profileData, setProfileData] = useState({
    bio: "",
    image: null,
    username: "",
  });
  const [charCount, setCharCount] = useState(200);
  const [fieldErrors, setFieldErrors] = useState({
    image: "",
    bio: "",
    username: ""
  });
  const navigate = useNavigate();

  // Clear errors when user starts typing
  useEffect(() => {
    if (error.message) {
      const timer = setTimeout(() => {
        setError({ message: "", code: "", type: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error.message]);

  const handlePreviewImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, image: "Please select a valid image (JPEG, PNG, GIF, WebP)" }));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setFieldErrors(prev => ({ ...prev, image: "Image size must be less than 5MB" }));
      return;
    }

    setFieldErrors(prev => ({ ...prev, image: "" }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.onerror = () => {
      setFieldErrors(prev => ({ ...prev, image: "Error reading image file" }));
    };
    reader.readAsDataURL(file);
  };

  const handleTextCount = (e) => {
    const textLength = e.target.value.length;
    setCharCount(200 - textLength);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Clear field-specific errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }

    if (name === 'image') {
      setProfileData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }

    if (error.message) {
      setError({ message: "", code: "", type: "" });
    }
  };

  const validateForm = () => {
    const newFieldErrors = {
      image: "",
      bio: "",
      username: ""
    };
    let isValid = true;

    // // Validate image
    // if (!profileData.image) {
    //   newFieldErrors.image = "Profile image is required";
    //   isValid = false;
    // }

    // // Validate bio
    // if (!profileData.bio.trim()) {
    //   newFieldErrors.bio = "Bio is required";
    //   isValid = false;
    // } else if (profileData.bio.trim().length < 10) {
    //   newFieldErrors.bio = "Bio must be at least 10 characters long";
    //   isValid = false;
    // }

    if (!profileData.username.trim()) {
      newFieldErrors.username = "Username is required";
      isValid = false;
    } else {
      const usernameRegex = /^[a-zA-Z0-9@]{3,20}$/;
      if (!usernameRegex.test(profileData.username)) {
        newFieldErrors.username = "Username must be 3-20 characters (letters numbers,@ only)";
        isValid = false;
      }
    }

    setFieldErrors(newFieldErrors);
    return isValid;
  };

  const handleApiError = (error) => {
    console.error("API Error:", error);
    
    if (!error.response) {
      return {
        message: "Network error: Please check your internet connection and try again.",
        code: "NETWORK_ERROR",
        type: "network"
      };
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        if (data.code === "USERNAME_TAKEN") {
          return {
            message: "This username is already taken. Please choose a different one.",
            code: data.code,
            type: "username"
          };
        } else if (data.code === "MISSING_FIELDS") {
          return {
            message: "Please fill in all required fields.",
            code: data.code,
            type: "validation"
          };
        } else if (data.code === "NO_FILE_UPLOADED") {
          return {
            message: "Please select a profile image.",
            code: data.code,
            type: "image"
          };
        }
        return {
          message: data.message || "Invalid data provided. Please check your information.",
          code: data.code || "VALIDATION_ERROR",
          type: "validation"
        };

      case 401:
        return {
          message: "Your session has expired. Please log in again.",
          code: "SESSION_EXPIRED",
          type: "auth"
        };

      case 403:
        return {
          message: "You don't have permission to perform this action.",
          code: "PERMISSION_DENIED",
          type: "auth"
        };

      case 404:
        return {
          message: "User account not found. Please complete your profile setup first.",
          code: "USER_NOT_FOUND",
          type: "user"
        };

      case 413:
        return {
          message: "Image file is too large. Please select an image smaller than 5MB.",
          code: "FILE_TOO_LARGE",
          type: "image"
        };

      case 500:
        return {
          message: "Server is temporarily unavailable. Please try again in a few minutes.",
          code: "SERVER_ERROR",
          type: "server"
        };

      default:
        return {
          message: data?.message || "An unexpected error occurred. Please try again.",
          code: data?.code || "UNKNOWN_ERROR",
          type: "unknown"
        };
    }
  };

  const removeAtSymbol = (str) => {
    if (str.startsWith('@')) {
        return str.slice(1);
    }
    return str;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError({
        message: "Please fix the errors below before submitting.",
        code: "FORM_VALIDATION_FAILED",
        type: "validation"
      });
      return;
    }

    const Fid = auth.currentUser?.uid;
    if (!Fid) {
      setError({
        message: "Authentication error. Please log in again.",
        code: "AUTH_ERROR",
        type: "auth"
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    try {
      setLoading(true);
      setError({ message: "", code: "", type: "" });

      const userName = "@" + removeAtSymbol(profileData.username);
      const formData = new FormData();
      formData.append("bio", profileData.bio.trim());
      formData.append("image", profileData.image);
      formData.append("username", userName);
      formData.append("FUid", Fid);

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/profile`, formData, {
        // timeout: 60000,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${progress}%`);
        }
      });

      const result = res.data;

      if (result.code === "PROFILE_UPDATED") {
        setProfileData({
          bio: "",
          image: null,
          username: "",
        });
        setPreviewImage(null);
        setCharCount(200);
        navigate('/home');
      } else {
        throw new Error(result.message || "Unexpected response from server");
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(errorInfo);

      // Special handling for username errors - focus on username field
      if (errorInfo.type === "username") {
        document.getElementById("username")?.focus();
      }

      // Auto-redirect for auth errors
      if (errorInfo.type === "auth") {
        setTimeout(() => navigate('/login'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (window.confirm("Are you sure you want to skip profile setup? You can add this information later.")) {
      navigate('/home');
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    setProfileData(prev => ({ ...prev, image: null }));
    setFieldErrors(prev => ({ ...prev, image: "" }));
    // Reset file input
    const fileInput = document.getElementById('profileImage');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-neutral-900 text-white min-h-screen flex items-center justify-center px-3 py-8">
      <div className="border-gray-700 border rounded-xl shadow-2xl shadow-gray-900 h-auto w-full max-w-md mx-auto">
        <div className="p-6">
          <div className="flex flex-col gap-y-6 items-center justify-center">
            <h1 className="text-2xl font-bold text-white">Complete Your Profile</h1>
            
            {/* Error Display */}
            {error.message && (
              <div className={`w-full p-3 rounded-lg flex items-start space-x-2 ${
                error.type === 'validation' ? 'bg-amber-500/20 border border-amber-500' :
                error.type === 'username' ? 'bg-rose-500/20 border border-rose-500' :
                error.type === 'auth' ? 'bg-red-500/20 border border-red-500' :
                'bg-gray-500/20 border border-gray-500'
              }`}>
                <svg 
                  className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    error.type === 'validation' ? 'text-amber-500' :
                    error.type === 'username' ? 'text-rose-500' :
                    error.type === 'auth' ? 'text-red-500' :
                    'text-gray-500'
                  }`} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <span className="text-sm font-medium">{error.message}</span>
                </div>
                <button 
                  onClick={() => setError({ message: "", code: "", type: "" })}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            {/* Profile Image Upload */}
            <div className="flex flex-col items-center gap-y-3">
              <label
                htmlFor="profileImage"
                className="h-32 w-32 rounded-full border-2 border-dashed border-gray-600 cursor-pointer flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors duration-200 bg-neutral-800"
              >
                {previewImage ? (
                  <div className="relative h-full w-full">
                    <img
                      src={previewImage}
                      alt="Profile Preview"
                      className="h-full w-full object-cover rounded-full"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-12 h-12 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
              </label>
              
              <div className="flex flex-col items-center gap-y-1">
                <input
                  onChange={(e) => { handlePreviewImage(e); handleChange(e); }}
                  type="file"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  id="profileImage"
                  className="hidden"
                />
                <span className="text-gray-300">Upload Profile Image</span>
                {previewImage && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="text-sm text-rose-500 hover:text-rose-400 transition-colors"
                  >
                    Remove Image
                  </button>
                )}
                {fieldErrors.image && (
                  <span className="text-sm text-rose-500">{fieldErrors.image}</span>
                )}
              </div>
            </div>

            {/* Bio Input */}
            <div className="w-full">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                Bio <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={profileData.bio}
                  onChange={(e) => { handleTextCount(e); handleChange(e); }}
                  name="bio"
                  id="bio"
                  rows={4}
                  maxLength={200}
                  className={`w-full resize-none p-3 bg-neutral-800 border rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 ${
                    fieldErrors.bio ? 'border-rose-500' : 'border-gray-600'
                  }`}
                  placeholder="Tell us about yourself..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  <span>{charCount}</span>/200
                </div>
              </div>
              {fieldErrors.bio && (
                <span className="text-sm text-rose-500 mt-1">{fieldErrors.bio}</span>
              )}
            </div>

            {/* Username Input */}
            <div className="w-full">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <span className="absolute left-3 text-gray-400">@</span>
                  <input
                    className={`w-full pl-8 pr-3 py-3 bg-neutral-800 border rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition duration-200 ${
                      fieldErrors.username || error.type === 'username' ? 'border-rose-500' : 'border-gray-600'
                    }`}
                    type="text"
                    placeholder="username"
                    name="username"
                    id="username"
                    value={profileData.username}
                    onChange={handleChange}
                  />
                </div>
                {fieldErrors.username && (
                  <span className="text-sm text-rose-500 mt-1">{fieldErrors.username}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 w-full mt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                disabled={loading}
              >
                Skip for Now
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading...
                  </div>
                ) : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBio;