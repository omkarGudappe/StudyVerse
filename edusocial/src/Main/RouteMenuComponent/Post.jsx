import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios';
import { auth } from '../../Auth/AuthProviders/FirebaseSDK';
import Socket from '../../SocketConnection/Socket';
import { usePostsStore } from '../../StateManagement/StoreNotes';

const Post = ({ ModelCloseClicked }) => {
    const [Selected, setSelected] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [Loading, setLoading] = useState(false);
    const [Percent, setPercent] = useState(0);
    const [page, setPage] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [PostDetail, setPostDetail] = useState({
        heading: "",
        description: "",
        image: "",
        visibility: "",
    })
    const [PostContent, setPostContent] = useState("");
    const cancelRequest = useRef(null);
    const { addPost } = usePostsStore();
    const [uploadPhase, setUploadPhase] = useState('');

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
            scale: 0.95
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction) => ({
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
            scale: 0.95
        }),
    };

    const [direction, setDirection] = useState(0);

    const contentTypes = [
        {
            type: "post",
            label: "Post",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            description: "Share images and photos",
            color: "from-blue-500 to-cyan-500"
        },
        {
            type: "lesson",
            label: "Lesson",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
            description: "Upload educational videos",
            color: "from-purple-500 to-pink-500"
        },
        {
            type: "note",
            label: "Notes",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            description: "Share study materials",
            color: "from-amber-500 to-orange-500"
        }
    ];

    const handleFileChange = (e) => {
        if (e.target.name === 'image') {
            const selectedFile = e.target.files[0];
            if (!selectedFile) return;
            
            const validTypes = {
                post: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                lesson: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v'],
                note: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            };

            // Check if file type is valid
            if (!validTypes[PostContent]?.includes(selectedFile.type)) {
                setError(`Please select a valid ${PostContent} file type. Got: ${selectedFile.type}`);
                return;
            }

            // Check file size limits
            const fileSizeInMB = selectedFile.size / (1024 * 1024);
            
            if (PostContent === 'lesson' && fileSizeInMB > 100) {
                setError(`Video files must be less than 100MB. Your file is ${fileSizeInMB.toFixed(2)}MB.`);
                return;
            }
            
            if (PostContent === 'post' && fileSizeInMB > 10) {
                setError(`Image files must be less than 10MB. Your file is ${fileSizeInMB.toFixed(2)}MB.`);
                return;
            }
            
            if (PostContent === 'note' && fileSizeInMB > 5) {
                setError(`Document files must be less than 5MB. Your file is ${fileSizeInMB.toFixed(2)}MB.`);
                return;
            }

            setSelected(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setPostDetail((prev) => ({ ...prev, image: selectedFile }));
            setError(null);
        } else {
            setPostDetail((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    }

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    }

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileChange({ target: { name: 'image', files: [files[0]] } });
        }
    }

    React.useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 9000);
            return () => clearTimeout(timer);
        }
    }, [error]);

  // Add this useEffect for Socket.IO progress tracking
// Update your useEffect socket listener
React.useEffect(() => {
  const handleUploadProgress = (data) => {
    console.log('📡 Progress update received:', data);
    
    let calculatedPercent = 0;
    
    // Fix the progress mapping logic - backend sends 0-300, frontend needs 0-100
    switch (data.phase) {
      case 'processing':
        // Backend sends 100 = 10% in frontend
        calculatedPercent = 10;
        break;
      case 'analyzing':
        // Backend sends 100 = 15% in frontend  
        calculatedPercent = 15;
        break;
      case 'compressing':
        // Backend sends 100-200, map to 15-70% in frontend
        // data.progress ranges from 100 to 200
        const compressionRange = data.progress - 100; // 0 to 100
        calculatedPercent = 15 + (compressionRange * 0.55); // 15% to 70%
        break;
      case 'uploading_to_cdn':
        // Backend sends 200, map to 70-95% in frontend
        calculatedPercent = 70 + Math.random() * 10; // 70-80% with some variation
        break;
      case 'complete':
        calculatedPercent = 100;
        setUploadStatus('success');
        setLoading(false);
        // Leave room on completion
        const Fid = auth.currentUser.uid;
        Socket.emit('leaveUploadRoom', Fid);
        break;
      case 'error':
        setError(data.message || 'Upload failed');
        setUploadStatus('error');
        setLoading(false);
        // Leave room on error
        const FidError = auth.currentUser.uid;
        Socket.emit('leaveUploadRoom', FidError);
        return;
      default:
        // Direct mapping: backend 0-300 → frontend 0-100
        calculatedPercent = Math.min((data.progress / 3), 100);
    }
    
    // Ensure we don't go over 100% and provide minimum progress
    calculatedPercent = Math.max(5, Math.min(Math.round(calculatedPercent), 100));
    
    console.log(`📡 Mapping: backend ${data.progress} (${data.phase}) → frontend ${calculatedPercent}%`);
    
    setPercent(calculatedPercent);
    setUploadPhase(data.phase);
    
    if (data.message) {
      console.log('📡 Progress message:', data.message);
    }
  };

  const handleUploadError = (error) => {
    console.error('📡 Upload error received:', error);
    setError(error.message || 'Upload failed');
    setUploadStatus('error');
    setLoading(false);
  };

  // Listen for progress updates
  console.log('📡 Setting up socket listeners for uploadProgress');
  Socket.on('uploadProgress', handleUploadProgress);
  Socket.on('uploadError', handleUploadError);

  return () => {
    console.log('📡 Cleaning up socket listeners');
    Socket.off('uploadProgress', handleUploadProgress);
    Socket.off('uploadError', handleUploadError);
  };
}, []);

// Replace your current handleSubmit function with this:
const handleSubmit = async () => {
  if (!PostDetail.heading.trim()) {
    setError("Please add a title for your content");
    return;
  }
  
  if (!PostDetail.visibility) {
    setError("Please select a visibility option");
    return;
  }

  const form = new FormData();
  const Fid = auth.currentUser.uid;
  form.append('heading', PostDetail.heading.trim());
  form.append('description', PostDetail.description.trim());
  form.append('image', PostDetail.image);
  form.append('contentType', PostContent);
  form.append('visibility', PostDetail.visibility);

  setLoading(true);
  setUploadStatus('uploading');
  setPercent(0);
  setUploadPhase('preparing');

  try {
    cancelRequest.current = axios.CancelToken.source();

    Socket.emit('joinUploadRoom', Fid);

    setUploadPhase('uploading');

    const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/posts/${Fid}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      cancelToken: cancelRequest.current.token,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const uploadProgress = Math.round((progressEvent.loaded * 30) / progressEvent.total);
          setPercent(uploadProgress);
        }
      },
      timeout: 300000,
    });

    const result = res.data;
    if (result && result.newPost) {
      // Success is now handled by WebSocket 'complete' phase
      addPost(result.newPost);
      console.log(result.uploadFile, "for checking url");
      Socket.emit("NewPostUploded", { upload: true });
      setTimeout(() => ModelCloseClicked(false), 1500);
    } else {
      throw new Error(result.message || "Failed to upload");
    }
  } catch (err) {
    if (axios.isCancel(err)) {
      setUploadStatus('idle');
      setError("Upload cancelled");
    } else if (err.code === 'ECONNABORTED') {
      setError("Upload timed out. Please try again with a smaller file or better connection.");
      setUploadStatus('error');
    } else if (err.response) {
      // Server responded with error status
      const status = err.response.status;
      const message = err.response.data?.message || "Upload failed";
      
      switch (status) {
        case 400:
          setError(message || "Missing required fields");
          break;
        case 401:
          setError("Please log in again to upload content");
          break;
        case 403:
          setError("You don't have permission to upload content");
          break;
        case 404:
          setError("User not found. Please check your account");
          break;
        case 413:
          setError("File too large. Please choose a smaller file");
          break;
        case 415:
          setError("Unsupported file type");
          break;
        case 500:
        case 502:
        case 503:
          setError("Server error. Please try again later");
          break;
        default:
          setError(message || "Upload failed. Please try again.");
      }
      setUploadStatus('error');
    } else if (err.request) {
      // Network error
      setError("Network error. Please check your connection and try again.");
      setUploadStatus('error');
    } else {
      // Other errors
      setError(err.message || "An unexpected error occurred");
      setUploadStatus('error');
    }
    setLoading(false);
  }
};

    const handleCheckSelectedData = () => {
        if (!Selected) {
            setError("Please select content to share");
            return;
        }
        navigateTo(2);
    }

    const handleCancelUpload = () => {
        if (cancelRequest.current) {
            cancelRequest.current.cancel("Upload cancelled by user");
        }
        setUploadStatus('idle');
        setLoading(false);
        setPercent(0);
        setUploadPhase('');
    }

    const handleCancel = () => {
        if (uploadStatus === 'uploading' && cancelRequest.current) {
            cancelRequest.current.cancel("Upload cancelled by user");
        }
        
        setSelected(false);
        setPostDetail({
            heading: "",
            description: "",
            image: "",
            visibility: "",
        });
        setPreview(null);
        setUploadStatus('idle');
        setPercent(0);
        setPage(0);
        setError(null);
        setUploadPhase('');
    }

    const navigateTo = (newPage) => {
        setDirection(newPage > page ? 1 : -1);
        setPage(newPage);
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='relative lenis bg-neutral-900 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-neutral-700'
                onClick={(e) => e.stopPropagation()}
            >
                <div className='flex items-center justify-between p-6 border-b border-neutral-700 bg-neutral-800/50'>
                    <h2 className='text-xl font-bold text-white'>
                        {page === 0 ? 'Create New Post' : page === 1 ? 'Add Content' : 'Final Details'}
                    </h2>
                    <button 
                        className='p-2 hover:bg-neutral-700 rounded-full transition-colors duration-200'
                        onClick={ModelCloseClicked}
                        disabled={uploadStatus === 'uploading'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className='w-full bg-neutral-800 h-1'>
                    <motion.div 
                        className='bg-gradient-to-r from-blue-500 to-purple-500 h-full'
                        initial={{ width: '0%' }}
                        animate={{ width: `${(page / 2) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    {page === 0 && (
                        <motion.div
                            key="page1"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className='p-6'
                        >
                            <div className='text-center mb-8'>
                                <h3 className='text-2xl font-bold text-white mb-3'>What would you like to share?</h3>
                                <p className='text-neutral-400'>Choose the type of content you want to post</p>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                                {contentTypes.map((content) => (
                                    <motion.button
                                        key={content.type}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setPostContent(content.type);
                                            navigateTo(1);
                                        }}
                                        className={`p-6 rounded-2xl border-2 border-neutral-700 bg-neutral-800/50 hover:border-${content.color.split('-')[1]}-500 transition-all duration-300 group`}
                                    >
                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${content.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            {content.icon}
                                        </div>
                                        <h4 className='text-white font-semibold text-center mb-2'>{content.label}</h4>
                                        <p className='text-neutral-400 text-sm text-center'>{content.description}</p>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {page === 1 && (
                        <motion.div 
                            key="page2"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className='p-6 h-auto'
                        >
                            <div className='text-center mb-6'>
                                <h3 className='text-xl font-bold text-white mb-2'>Add Your Content</h3>
                                <p className='text-neutral-400'>Upload your {PostContent} file</p>
                            </div>

                            <div className='mb-6'>
                                {preview ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-neutral-800 rounded-2xl p-4 border border-neutral-700"
                                    >
                                        <div className="relative">
                                            {Selected.type.startsWith("image/") && (
                                                <img
                                                    src={preview}
                                                    alt="Preview"
                                                    className="w-full h-64 object-cover rounded-xl"
                                                />
                                            )}
                                            {Selected.type.startsWith("video/") && (
                                                <video
                                                    src={preview}
                                                    controls
                                                    className="w-full h-64 object-cover rounded-xl"
                                                />
                                            )}
                                            {Selected.type === "application/pdf" && (
                                                <div className="w-full h-64 bg-neutral-700 rounded-xl flex items-center justify-center">
                                                    <div className="text-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="mt-2 text-white font-medium">{Selected.name}</p>
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelected(false);
                                                    setPreview(null);
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="mt-4 p-3 bg-neutral-700/30 rounded-lg">
                                            <p className="text-sm text-neutral-300 mb-2">File details:</p>
                                            <div className="text-xs text-neutral-400 space-y-1">
                                                <p>Name: <span className="text-neutral-300">{Selected.name}</span></p>
                                                <p>Type: <span className="text-neutral-300">{Selected.type}</span></p>
                                                <p>Size: <span className="text-neutral-300">{formatFileSize(Selected.size)}</span></p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        whileHover={{ scale: 1.02 }}
                                        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
                                            ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-600 hover:border-neutral-500 bg-neutral-800/50'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('fileInput').click()}
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-4 bg-neutral-700/30 rounded-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-lg font-medium text-white mb-2">Drop your file here</h3>
                                                <p className="text-neutral-400 text-sm">or click to browse files</p>
                                                <p className="text-xs text-neutral-500 mt-2">
                                                    {PostContent === "post" ? "JPG, PNG, GIF, WEBP (Max 10MB)" : 
                                                     PostContent === "lesson" ? "MP4, WEBM, OGG (Max 100MB)" : 
                                                     "PDF, TXT, DOC, DOCX (Max 5MB)"}
                                                </p>
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            onChange={handleFileChange}
                                            id='fileInput'
                                            name='image'
                                            accept={PostContent === "post" ? 'image/*' : PostContent === "lesson" ? "video/*" : '.pdf,.txt,.doc,.docx'}
                                            className='hidden' 
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"
                                >
                                    <p className="text-red-400 text-sm">{error}</p>
                                </motion.div>
                            )}

                            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className='px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-full transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2'
                                    onClick={handleCheckSelectedData}
                                    disabled={!Selected}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Continue
                                </motion.button>
                                <button 
                                    className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto'
                                    onClick={() => navigateTo(0)}
                                >
                                    Back
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {page === 2 && (
                        <motion.div
                            key="page3"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="p-6"
                        >
                            <div className='text-center mb-6'>
                                <h3 className='text-xl font-bold text-white mb-2'>Final Details</h3>
                                <p className='text-neutral-400'>Add some information about your content</p>
                            </div>

                            {uploadStatus === 'uploading' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 mb-6"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <span className="text-white text-sm font-medium block capitalize">
                                        {uploadPhase.replace(/_/g, ' ')}
                                        {uploadPhase === 'compressing' && ' video'}
                                        </span>
                                        <span className="text-blue-500 text-xs">
                                        {uploadPhase === 'compressing' && Selected ? 
                                            `Compressing ${formatFileSize(Selected.size)} - ${Percent}%` : 
                                            uploadPhase === 'uploading_to_cdn' ? 'Uploading to cloud storage...' :
                                            uploadPhase === 'processing' ? 'Processing your file...' :
                                            'Uploading...'}
                                        </span>
                                    </div>
                                    <span className="text-blue-500 text-sm font-bold">{Percent}%</span>
                                    </div>
                                    
                                    <div className="w-full bg-neutral-700 rounded-full h-2.5 mb-2 relative overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${Percent}%` }}
                                    ></div>
                                    {Percent > 0 && Percent < 100 && (
                                        <div className="absolute top-0 left-0 w-full h-full animate-pulse">
                                        <div 
                                            className="bg-white/20 h-full w-10 -skew-x-12 animate-shimmer"
                                            style={{ 
                                            animationDuration: Percent > 80 ? '1s' : '2s',
                                            opacity: Percent > 80 ? 0.3 : 0.2 
                                            }}
                                        ></div>
                                        </div>
                                    )}
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                    <p className="text-neutral-400 text-xs">
                                        {uploadPhase === 'compressing' ? 'Video compression in progress...' : 
                                        uploadPhase === 'uploading_to_cdn' ? 'Finalizing upload...' : 
                                        uploadPhase === 'processing' ? 'Processing your file...' : 'Uploading...'}
                                    </p>
                                    <button 
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full transition-colors disabled:opacity-50"
                                        onClick={handleCancelUpload}
                                        disabled={uploadPhase === 'complete'}
                                    >
                                        Cancel
                                    </button>
                                    </div>
                                </motion.div>
                                )}

                            {uploadStatus === 'success' && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6"
                                >
                                    <div className="flex items-center justify-center">
                                        <svg className="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-green-400 font-medium">Upload successful!</span>
                                    </div>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"
                                >
                                    <p className="text-red-400 text-sm">{error}</p>
                                </motion.div>
                            )}

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Title *</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-neutral-500"
                                        placeholder="Enter a compelling title..."
                                        value={PostDetail.heading}
                                        name='heading'
                                        onChange={handleFileChange}
                                        disabled={uploadStatus === 'uploading'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
                                    <textarea 
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-neutral-500 resize-none"
                                        placeholder="Describe your content..."
                                        rows="4"
                                        name='description'
                                        value={PostDetail.description}
                                        onChange={handleFileChange}
                                        disabled={uploadStatus === 'uploading'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-300 mb-2">Visibility *</label>
                                    <select 
                                        className='w-full bg-neutral-800 border-neutral-700 py-3 px-4 rounded-xl text-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        onChange={(e) => setPostDetail({...PostDetail , visibility: e.target.value})}
                                        value={PostDetail.visibility}
                                        disabled={uploadStatus === 'uploading'}
                                    >
                                        <option value="">Select Post status</option>
                                        <option value="public">Public</option>
                                        <option value="peers">Peers Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className='flex flex-col sm:flex-row gap-3 justify-between'>
                                <button 
                                    className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto'
                                    onClick={() => navigateTo(1)}
                                    disabled={uploadStatus === 'uploading'}
                                >
                                    Back
                                </button>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <motion.button 
                                        whileHover={{ scale: uploadStatus !== 'uploading' ? 1.02 : 1 }}
                                        whileTap={{ scale: uploadStatus !== 'uploading' ? 0.98 : 1 }}
                                        className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 ${
                                            uploadStatus === 'uploading' 
                                                ? 'bg-blue-600 cursor-not-allowed' 
                                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                                        }`}
                                        onClick={handleSubmit}
                                        disabled={uploadStatus === 'uploading' || !PostDetail.heading.trim() || !PostDetail.visibility}
                                    >
                                        {uploadStatus === 'uploading' ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Uploading...
                                            </>
                                        ) : uploadStatus === 'success' ? (
                                            'Posted!'
                                        ) : (
                                            'Share Now'
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default Post