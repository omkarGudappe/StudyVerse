import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios';
import { auth } from '../../Auth/AuthProviders/FirebaseSDK';

const Post = ({ ModelCloseClicked }) => {
    const [Selected, setSelected] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [Loading, setLoading] = useState(false);
    const [Percent, setPercent] = useState(0);
    const [page, setPage] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
    const [PostDetail, setPostDetail] = useState({
        heading: "",
        descreption: "",
        image: "",
    })
    const cancelRequest = useRef(null);

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? "100%" : "-100%",
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction) => ({
            x: direction < 0 ? "100%" : "-100%",
            opacity: 0,
        }),
    };

    const [direction, setDirection] = useState(0);

    const handleFileChange = (e) => {
        if (e.target.name === 'image') {
            const selectedFile = e.target.files[0];
            if (!selectedFile) return;
            if (
                !selectedFile.type.startsWith("image/") &&
                !selectedFile.type.startsWith("video/") &&
                selectedFile.type !== "application/pdf"
            ) {
                alert("Only images, videos, or PDFs are allowed.");
                return;
            }
            setSelected(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setPostDetail((prev) => ({ ...prev, image: selectedFile }));
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

    const handleSubmit = async () => {
        const form = new FormData();
        const Fid = auth.currentUser.uid;
        form.append('heading', PostDetail.heading);
        form.append('description', PostDetail.descreption);
        form.append('image', PostDetail.image);
        setLoading(true);
        setUploadStatus('uploading');
        setPercent(0);

        try {
            // Create a cancel token for the request
            cancelRequest.current = axios.CancelToken.source();
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/posts/${Fid}`, form, {
                headers: { "Content-Type": "multipart/form-data" },
                cancelToken: cancelRequest.current.token,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        // Calculate progress more accurately
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setPercent(percent);
                    }
                }
            });

            const result = await res.data;
            if (result) {
                console.log("Post created successfully:", result.newPost);
                setUploadStatus('success');
                // Close modal after a brief success display
                setTimeout(() => {
                    ModelCloseClicked(false);
                }, 1500);
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log("Upload cancelled:", err.message);
                setUploadStatus('idle');
            } else {
                console.error("Error submitting post:", err);
                setUploadStatus('error');
            }
            setLoading(false);
        }
    }

    const handleCancelUpload = () => {
        if (cancelRequest.current) {
            cancelRequest.current.cancel("Upload cancelled by user");
        }
        setUploadStatus('idle');
        setLoading(false);
        setPercent(0);
    }

    const handleCancel = () => {
        // Cancel any ongoing upload
        if (uploadStatus === 'uploading' && cancelRequest.current) {
            cancelRequest.current.cancel("Upload cancelled by user");
        }
        
        setSelected(false);
        setPostDetail({
            heading: "",
            descreption: "",
            image: "",
        });
        setSelected(false);
        setPreview(null);
        setUploadStatus('idle');
        setPercent(0);
        ModelCloseClicked(false);
    }

    const navigateTo = (newPage) => {
        console.log("Navigating to page:", newPage);
        setDirection(newPage > page ? 1 : -1);
        setPage(newPage);
    }

    return (
        <div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'>
            <div 
                className='relative bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl'
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    className='absolute top-4 right-4 z-10 p-2 bg-neutral-700/80 hover:bg-neutral-600 rounded-full transition-colors'
                    onClick={() => ModelCloseClicked(false)}
                    aria-label="Close modal"
                    disabled={uploadStatus === 'uploading'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
                        width="24" height="24" fill="none" stroke="currentColor" 
                        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <line x1="6" y1="6" x2="18" y2="18"/>
                        <line x1="18" y1="6" x2="6" y2="18"/>
                    </svg>
                </button>
                
                <AnimatePresence mode="wait" custom={direction}>
                    {page === 0 ? (
                        <motion.div 
                            key="page1"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className='p-6 flex flex-col'
                        >
                            <h2 className='text-2xl font-bold text-white mb-6 text-center'>Share Your Content</h2>
                            
                            <div className='flex-1 overflow-auto'>
                                {preview ? (
                                    <div className='mb-6'>
                                        <div className="rounded-lg overflow-hidden bg-neutral-900/50 p-2">
                                            {Selected.type.startsWith("image/") && (
                                                <img
                                                    src={preview}
                                                    alt="preview"
                                                    className="w-full max-h-64 object-contain mx-auto rounded"
                                                />
                                            )}

                                            {Selected.type.startsWith("video/") && (
                                                <video
                                                    src={preview}
                                                    controls
                                                    className="w-full max-h-64 object-contain mx-auto rounded"
                                                />
                                            )}

                                            {Selected.type === "application/pdf" && (
                                                <div className="w-full h-64 bg-neutral-900 rounded flex items-center justify-center">
                                                    <div className="text-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="mt-2 text-white">{Selected.name}</p>
                                                        <p className="text-sm text-neutral-400">PDF Document</p>
                                                    </div>
                                                </div>
                                            )}

                                            {Selected.type !== "application/pdf" &&
                                                !Selected.type.startsWith("image/") &&
                                                !Selected.type.startsWith("video/") && (
                                                <div className="w-full h-40 bg-neutral-900 rounded flex items-center justify-center">
                                                    <div className="text-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <p className="mt-2 text-white truncate max-w-xs">{Selected.name}</p>
                                                        <p className="text-sm text-neutral-400">File</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 bg-neutral-900/30 p-3 rounded-lg">
                                            <p className="text-sm text-neutral-300 mb-2">File details:</p>
                                            <div className="text-xs text-neutral-400 space-y-1">
                                                <p>Name: <span className="text-neutral-300">{Selected.name}</span></p>
                                                <p>Type: <span className="text-neutral-300">{Selected.type}</span></p>
                                                <p>Size: <span className="text-neutral-300">{(Selected.size / 1024).toFixed(2)} KB</span></p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors cursor-pointer
                                            ${isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-600 hover:border-neutral-500'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('File').click()}
                                    >
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-4 bg-neutral-700/30 rounded-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" className='w-12 h-12 text-amber-500' viewBox="0 0 40 40"
                                                    fill="none" stroke="currentColor"
                                                    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
                                                >
                                                    <path d="M4 6h14l4 4v18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
                                                    <polyline points="18 6 18 10 22 10"/>
                                                    <line x1="6" y1="14" x2="16" y2="14"/>
                                                    <line x1="6" y1="18" x2="14" y2="18"/>
                                                    <rect x="16" y="16" width="20" height="16" rx="2" ry="2"/>
                                                    <polygon points="24,20 30,24 24,28"/>
                                                </svg>
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-xl font-medium text-white mb-2">Select Notes or Lesson</h3>
                                                <p className="text-neutral-400">Click to browse or drag and drop your file here</p>
                                                <p className="text-xs text-neutral-500 mt-2">Supports images, videos, PDFs and other documents</p>
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            onChange={handleFileChange} 
                                            id='File' 
                                            name='image'
                                            accept='*' 
                                            className='hidden' 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className='flex flex-col sm:flex-row gap-3 justify-center items-center pt-4 border-t border-neutral-700 mt-4'>
                                <button 
                                    className='px-6 py-3 bg-amber-600 hover:bg-amber-500 active:scale-95 cursor-pointer text-black font-semibold rounded-full transition-colors w-full sm:w-auto flex items-center justify-center gap-2 '
                                    onClick={() => navigateTo(1)}
                                    disabled={!Selected}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    Next
                                </button>
                                <button
                                    className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto'
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="page2"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3 }}
                            className="p-6 flex flex-col"
                        >
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">Additional Details</h2>
                            
                            {/* Upload Progress Bar - Only shown when uploading */}
                            {uploadStatus === 'uploading' && (
                                <div className="mb-6 bg-neutral-900 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white text-sm font-medium">Uploading...</span>
                                        <span className="text-amber-500 text-sm font-bold">{Percent}%</span>
                                    </div>
                                    <div className="w-full bg-neutral-700 rounded-full h-2.5">
                                        <div 
                                            className="bg-amber-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${Percent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-neutral-400 text-xs mt-2">
                                        Please wait while your file is being uploaded. Do not close this window.
                                    </p>
                                    <button 
                                        className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                                        onClick={handleCancelUpload}
                                    >
                                        Cancel Upload
                                    </button>
                                </div>
                            )}
                            
                            {/* Success Message */}
                            {uploadStatus === 'success' && (
                                <div className="mb-6 bg-green-900/30 p-4 rounded-lg border border-green-700">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        <span className="text-green-400 text-sm">Upload completed successfully!</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Error Message */}
                            {uploadStatus === 'error' && (
                                <div className="mb-6 bg-red-900/30 p-4 rounded-lg border border-red-700">
                                    <div className="flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                        <span className="text-red-400 text-sm">Upload failed. Please try again.</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="text-white mb-6">
                                <p className="mb-4">Please provide additional information about your content:</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Heading</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Enter a title for your content"
                                            value={PostDetail.heading}
                                            name='heading'
                                            onChange={(e)=>handleFileChange(e)}
                                            disabled={uploadStatus === 'uploading'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                                        <textarea 
                                            className="w-full bg-neutral-700 border resize-none border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="Describe your content"
                                            rows="3"
                                            name='descreption'
                                            value={PostDetail.descreption}
                                            onChange={(e) => handleFileChange(e)}
                                            disabled={uploadStatus === 'uploading'}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='border-t border-neutral-700 mt-auto pt-4'>
                                <div className='flex flex-col sm:flex-row gap-3 justify-between items-center'>
                                    <button 
                                        className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto flex items-center justify-center gap-2'
                                        onClick={() => navigateTo(0)}
                                        disabled={uploadStatus === 'uploading'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back
                                    </button>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button 
                                            className='px-6 py-3 bg-amber-600 active:scale-95 hover:bg-amber-500 text-black font-semibold rounded-full transition-colors w-full sm:w-auto flex items-center justify-center gap-2 disabled:bg-amber-800 disabled:cursor-not-allowed'
                                            onClick={handleSubmit}
                                            disabled={uploadStatus === 'uploading' || uploadStatus === 'success' || !PostDetail.heading}
                                        >
                                            {uploadStatus === 'uploading' ? (
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
                                                    Uploading...
                                                </div>
                                            ) : uploadStatus === 'success' ? 'Posted!' : 'Post'}
                                        </button>
                                        <button 
                                            className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto'
                                            onClick={handleCancel}
                                            disabled={uploadStatus === 'uploading'}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default Post