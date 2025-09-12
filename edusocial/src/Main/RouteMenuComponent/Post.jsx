// import React, { useState, useRef } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import axios from 'axios';
// import { auth } from '../../Auth/AuthProviders/FirebaseSDK';

// const Post = ({ ModelCloseClicked }) => {
//     const [Selected, setSelected] = useState(false);
//     const [preview, setPreview] = useState(null);
//     const [isDragging, setIsDragging] = useState(false);
//     const [Loading, setLoading] = useState(false);
//     const [Percent, setPercent] = useState(0);
//     const [page, setPage] = useState(0);
//     const [uploadStatus, setUploadStatus] = useState('idle');
//     const [error, setError] = useState(null);
//     const [PostDetail, setPostDetail] = useState({
//         heading: "",
//         descreption: "",
//         image: "",
//     })
//     const [PostContent, setPostContent] = useState("");
//     const cancelRequest = useRef(null);

//     const variants = {
//         enter: (direction) => ({
//             x: direction > 0 ? "100%" : "-100%",
//             opacity: 0,
//         }),
//         center: {
//             x: 0,
//             opacity: 1,
//         },
//         exit: (direction) => ({
//             x: direction < 0 ? "100%" : "-100%",
//             opacity: 0,
//         }),
//     };

//     const [direction, setDirection] = useState(0);

//     const handleFileChange = (e) => {
//         if (e.target.name === 'image') {
//             const selectedFile = e.target.files[0];
//             if (!selectedFile) return;
//             if (
//                 !selectedFile.type.startsWith("image/") &&
//                 !selectedFile.type.startsWith("video/") &&
//                 selectedFile.type !== "application/pdf"
//             ) {
//                 alert("Only images, videos, or PDFs are allowed.");
//                 return;
//             }
//             setSelected(selectedFile);
//             setPreview(URL.createObjectURL(selectedFile));
//             setPostDetail((prev) => ({ ...prev, image: selectedFile }));
//         } else {
//             setPostDetail((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//         }
//     };

//     const handleDragOver = (e) => {
//         e.preventDefault();
//         setIsDragging(true);
//     }

//     const handleDragLeave = (e) => {
//         e.preventDefault();
//         setIsDragging(false);
//     }

//     const handleDrop = (e) => {
//         e.preventDefault();
//         setIsDragging(false);
        
//         const files = e.dataTransfer.files;
//         if (files.length > 0) {
//             handleFileChange({ target: { name: 'image', files: [files[0]] } });
//         }
//     }

//     React.useEffect(() =>{
//         if(error){
//             setTimeout(() => {
//                 setError(null)
//             }, 9000)
//             return clearInterval();
//         }
//     }, [error])

//     const handleSubmit = async () => {
//         const form = new FormData();
//         const Fid = auth.currentUser.uid;
//         form.append('heading', PostDetail.heading);
//         form.append('description', PostDetail.descreption);
//         form.append('image', PostDetail.image);
//         setLoading(true);
//         setUploadStatus('uploading');
//         setPercent(0);

//         try {
//             cancelRequest.current = axios.CancelToken.source();
            
//             const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/posts/${Fid}`, form, {
//                 headers: { "Content-Type": "multipart/form-data" },
//                 cancelToken: cancelRequest.current.token,
//                 onUploadProgress: (progressEvent) => {
//                     if (progressEvent.total) {
//                         const percent = Math.round(
//                             (progressEvent.loaded * 100) / progressEvent.total
//                         );
//                         setPercent(percent);
//                     }
//                 }
//             });

//             const result = await res.data;
//             if (result) {
//                 console.log("Post created successfully:", result.newPost);
//                 setUploadStatus('success');
//                 // Close modal after a brief success display
//                 setTimeout(() => {
//                     ModelCloseClicked(false);
//                 }, 1500);
//             } else {
//                 throw new Error(result.message);
//             }
//         } catch (err) {
//             if (axios.isCancel(err)) {
//                 console.log("Upload cancelled:", err.message);
//                 setUploadStatus('idle');
//             } else {
//                 console.error("Error submitting post:", err);
//                 setUploadStatus('error');
//             }
//             setLoading(false);
//         }
//     }

//     const handleCheckSelectedData = () => {
//         if(!Selected){
//            return setError("Please First Select Your Content to post")
//         }
//         navigateTo(2)
//     }

//     const handleCancelUpload = () => {
//         if (cancelRequest.current) {
//             cancelRequest.current.cancel("Upload cancelled by user");
//         }
//         setUploadStatus('idle');
//         setLoading(false);
//         setPercent(0);
//     }

//     const handleCancel = () => {
//         // Cancel any ongoing upload
//         if (uploadStatus === 'uploading' && cancelRequest.current) {
//             cancelRequest.current.cancel("Upload cancelled by user");
//         }
        
//         setSelected(false);
//         setPostDetail({
//             heading: "",
//             descreption: "",
//             image: "",
//         });
//         setSelected(false);
//         setPreview(null);
//         setUploadStatus('idle');
//         setPercent(0);
//         ModelCloseClicked(false);
//     }

//     const navigateTo = (newPage) => {
//         console.log("Navigating to page:", newPage);
//         setDirection(newPage > page ? 1 : -1);
//         setPage(newPage);
//     }

//     return (
//         <div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'>
//             <div 
//                 className='relative bg-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl'
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 <button 
//                     className='absolute top-4 right-4 z-10 p-2 bg-neutral-700/80 hover:bg-neutral-600 rounded-full transition-colors'
//                     onClick={() => ModelCloseClicked(false)}
//                     aria-label="Close modal"
//                     disabled={uploadStatus === 'uploading'}
//                 >
//                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
//                         width="24" height="24" fill="none" stroke="currentColor" 
//                         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
//                     >
//                         <line x1="6" y1="6" x2="18" y2="18"/>
//                         <line x1="18" y1="6" x2="6" y2="18"/>
//                     </svg>
//                 </button>
                
//                 <AnimatePresence mode="wait" custom={direction}>
//                     {page === 0 ? (
//                         <motion.div
//                             key="page1"
//                             custom={direction}
//                             variants={variants}
//                             initial="enter"
//                             animate="center"
//                             exit="exit"
//                             transition={{ duration: 0.3 }}
//                             className='p-6 flex flex-col'
//                         >
//                             <div className='border-b-1 border-amber-500 flex justify-center '>
//                                 <h1 className='text-2xl text-amber-500 mb-6'>Which Type of Content You want to Share</h1>
//                             </div>
//                             <div className='flex flex-col gap-5 mt-5 p-8 border-b-1 border-amber-500'>
//                                 <button onClick={() => {setPostContent("image"); navigateTo(1)}} className='w-full bg-amber-500 p-3 text-xl rounded-full cursor-pointer' >
//                                     Posts
//                                 </button>
//                                 <button onClick={() => {setPostContent("video"); navigateTo(1)}} className='w-full bg-amber-500 p-3 text-xl rounded-full cursor-pointer' >
//                                     Lessons
//                                 </button>
//                                 <button onClick={() => {setPostContent("note"); navigateTo(1)}} className='w-full bg-amber-500 p-3 text-xl rounded-full cursor-pointer' >
//                                     Notes
//                                 </button>
//                             </div>
//                             <div>
//                                 Select Your Choice And go next
//                             </div>
//                         </motion.div>
//                     ) : page === 1 ? (
//                         <motion.div 
//                             key="page2"
//                             custom={direction}
//                             variants={variants}
//                             initial="enter"
//                             animate="center"
//                             exit="exit"
//                             transition={{ duration: 0.3 }}
//                             className='p-6 flex flex-col'
//                         >
//                             <h2 className='text-2xl font-bold text-white mb-6 text-center'>Share Your Content</h2>
                            
//                             <div className='flex-1 overflow-auto'>
//                                 {preview ? (
//                                     <div className='mb-6'>
//                                         <div className="rounded-lg overflow-hidden bg-neutral-900/50 p-2">
//                                             {Selected.type.startsWith("image/") && (
//                                                 <img
//                                                     src={preview}
//                                                     alt="preview"
//                                                     className="w-full max-h-64 object-contain mx-auto rounded"
//                                                 />
//                                             )}

//                                             {Selected.type.startsWith("video/") && (
//                                                 <video
//                                                     src={preview}
//                                                     controls
//                                                     className="w-full max-h-64 object-contain mx-auto rounded"
//                                                 />
//                                             )}

//                                             {Selected.type === "application/pdf" && (
//                                                 <div className="w-full h-64 bg-neutral-900 rounded flex items-center justify-center">
//                                                     <div className="text-center">
//                                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                                                         </svg>
//                                                         <p className="mt-2 text-white">{Selected.name}</p>
//                                                         <p className="text-sm text-neutral-400">PDF Document</p>
//                                                     </div>
//                                                 </div>
//                                             )}

//                                             {Selected.type !== "application/pdf" &&
//                                                 !Selected.type.startsWith("image/") &&
//                                                 !Selected.type.startsWith("video/") && (
//                                                 <div className="w-full h-40 bg-neutral-900 rounded flex items-center justify-center">
//                                                     <div className="text-center">
//                                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                                                         </svg>
//                                                         <p className="mt-2 text-white truncate max-w-xs">{Selected.name}</p>
//                                                         <p className="text-sm text-neutral-400">File</p>
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </div>

//                                         <div className="mt-4 bg-neutral-900/30 p-3 rounded-lg">
//                                             <p className="text-sm text-neutral-300 mb-2">File details:</p>
//                                             <div className="text-xs text-neutral-400 space-y-1">
//                                                 <p>Name: <span className="text-neutral-300">{Selected.name}</span></p>
//                                                 <p>Type: <span className="text-neutral-300">{Selected.type}</span></p>
//                                                 <p>Size: <span className="text-neutral-300">{(Selected.size / 1024).toFixed(2)} KB</span></p>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ) : (
//                                     <div 
//                                         className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors cursor-pointer
//                                             ${isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-600 hover:border-neutral-500'}`}
//                                         onDragOver={handleDragOver}
//                                         onDragLeave={handleDragLeave}
//                                         onDrop={handleDrop}
//                                         onClick={() => document.getElementById('File').click()}
//                                     >
//                                         <div className="flex flex-col items-center justify-center space-y-4">
//                                             <div className="p-4 bg-neutral-700/30 rounded-full">
//                                                 <svg xmlns="http://www.w3.org/2000/svg" className='w-12 h-12 text-amber-500' viewBox="0 0 40 40"
//                                                     fill="none" stroke="currentColor"
//                                                     strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
//                                                 >
//                                                     <path d="M4 6h14l4 4v18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>
//                                                     <polyline points="18 6 18 10 22 10"/>
//                                                     <line x1="6" y1="14" x2="16" y2="14"/>
//                                                     <line x1="6" y1="18" x2="14" y2="18"/>
//                                                     <rect x="16" y="16" width="20" height="16" rx="2" ry="2"/>
//                                                     <polygon points="24,20 30,24 24,28"/>
//                                                 </svg>
//                                             </div>
                                            
//                                             <div>
//                                                 <h3 className="text-xl font-medium text-white mb-2">Select {PostContent === 'image' ? "Your Post Content" : PostContent === "video" ? "Lesson Video" : "Your Notes to Share"}</h3>
//                                                 <p className="text-neutral-400">Click to browse or drag and drop your file here</p>
//                                                 <p className="text-xs text-neutral-500 mt-2">Supports images, videos, PDFs and other documents</p>
//                                             </div>
//                                         </div>
//                                         <input 
//                                             type="file" 
//                                             onChange={handleFileChange}
//                                             id='File' 
//                                             name='image'
//                                             accept={PostContent === "image" ? 'image/*' : PostContent === "video" ? "video/*" : '.pdf,.txt,application/pdf,text/plain'}
//                                             className='hidden' 
//                                         />
//                                     </div>
//                                 )}
//                             </div>


//                                 {error && <p className='text-red-600 text-center'>{error}</p>}
//                             <div className='flex flex-col sm:flex-row gap-3 justify-center items-center pt-4 border-t border-neutral-700 mt-4'>
//                                 <button 
//                                     className='px-6 py-3 bg-amber-600 hover:bg-amber-500 active:scale-95 cursor-pointer text-black font-semibold rounded-full transition-colors w-full sm:w-auto flex items-center justify-center gap-2 '
//                                     onClick={handleCheckSelectedData}
//                                 >
//                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                                     </svg>
//                                     Next
//                                 </button>
//                                 <button 
//                                     className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto flex items-center justify-center gap-2'
//                                     onClick={() => navigateTo(0)}
//                                 >
//                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                                     </svg>
//                                     Back
//                                 </button>
//                                 <button
//                                     className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto'
//                                     onClick={handleCancel}
//                                 >
//                                     Cancel
//                                 </button>
//                             </div>
//                         </motion.div>
//                     ) : (
//                         <motion.div
//                             key="page3"
//                             custom={direction}
//                             variants={variants}
//                             initial="enter"
//                             animate="center"
//                             exit="exit"
//                             transition={{ duration: 0.3 }}
//                             className="p-6 flex flex-col"
//                         >
//                             <h2 className="text-2xl font-bold text-white mb-6 text-center">Additional Details</h2>
                            
//                             {/* Upload Progress Bar - Only shown when uploading */}
//                             {uploadStatus === 'uploading' && (
//                                 <div className="mb-6 bg-neutral-900 p-4 rounded-lg">
//                                     <div className="flex justify-between items-center mb-2">
//                                         <span className="text-white text-sm font-medium">Uploading...</span>
//                                         <span className="text-amber-500 text-sm font-bold">{Percent}%</span>
//                                     </div>
//                                     <div className="w-full bg-neutral-700 rounded-full h-2.5">
//                                         <div 
//                                             className="bg-amber-500 h-2.5 rounded-full transition-all duration-300 ease-out"
//                                             style={{ width: `${Percent}%` }}
//                                         ></div>
//                                     </div>
//                                     <p className="text-neutral-400 text-xs mt-2">
//                                         Please wait while your file is being uploaded. Do not close this window.
//                                     </p>
//                                     <button 
//                                         className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
//                                         onClick={handleCancelUpload}
//                                     >
//                                         Cancel Upload
//                                     </button>
//                                 </div>
//                             )}
                            
//                             {/* Success Message */}
//                             {uploadStatus === 'success' && (
//                                 <div className="mb-6 bg-green-900/30 p-4 rounded-lg border border-green-700">
//                                     <div className="flex items-center">
//                                         <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
//                                         </svg>
//                                         <span className="text-green-400 text-sm">Upload completed successfully!</span>
//                                     </div>
//                                 </div>
//                             )}
                            
//                             {/* Error Message */}
//                             {uploadStatus === 'error' && (
//                                 <div className="mb-6 bg-red-900/30 p-4 rounded-lg border border-red-700">
//                                     <div className="flex items-center">
//                                         <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
//                                         </svg>
//                                         <span className="text-red-400 text-sm">Upload failed. Please try again.</span>
//                                     </div>
//                                 </div>
//                             )}
                            
//                             <div className="text-white mb-6">
//                                 <p className="mb-4">Please provide additional information about your content:</p>
//                                 <div className="space-y-4">
//                                     <div>
//                                         <label className="block text-sm font-medium text-neutral-300 mb-1">Heading</label>
//                                         <input 
//                                             type="text" 
//                                             className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
//                                             placeholder="Enter a title for your content"
//                                             value={PostDetail.heading}
//                                             name='heading'
//                                             onChange={(e)=>handleFileChange(e)}
//                                             disabled={uploadStatus === 'uploading'}
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
//                                         <textarea 
//                                             className="w-full bg-neutral-700 border resize-none border-neutral-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
//                                             placeholder="Describe your content"
//                                             rows="3"
//                                             name='descreption'
//                                             value={PostDetail.descreption}
//                                             onChange={(e) => handleFileChange(e)}
//                                             disabled={uploadStatus === 'uploading'}
//                                         />
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className='border-t border-neutral-700 mt-auto pt-4'>
//                                 <div className='flex flex-col sm:flex-row gap-3 justify-between items-center'>
//                                     <button 
//                                         className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto flex items-center justify-center gap-2'
//                                         onClick={() => navigateTo(1)}
//                                         disabled={uploadStatus === 'uploading'}
//                                     >
//                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                                         </svg>
//                                         Back
//                                     </button>
//                                     <div className="flex flex-col sm:flex-row gap-3">
//                                         <button 
//                                             className='px-6 py-3 bg-amber-600 active:scale-95 hover:bg-amber-500 text-black font-semibold rounded-full transition-colors w-full sm:w-auto flex items-center justify-center gap-2 disabled:bg-amber-800 disabled:cursor-not-allowed'
//                                             onClick={handleSubmit}
//                                             disabled={uploadStatus === 'uploading' || uploadStatus === 'success' || !PostDetail.heading}
//                                         >
//                                             {uploadStatus === 'uploading' ? (
//                                                 <div className="flex items-center justify-center">
//                                                     <svg
//                                                         className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                                                         xmlns="http://www.w3.org/2000/svg"
//                                                         fill="none"
//                                                         viewBox="0 0 24 24"
//                                                     >
//                                                         <circle
//                                                         className="opacity-25"
//                                                         cx="12"
//                                                         cy="12"
//                                                         r="10"
//                                                         stroke="currentColor"
//                                                         strokeWidth="4"
//                                                         ></circle>
//                                                         <path
//                                                         className="opacity-75"
//                                                         fill="currentColor"
//                                                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                                                         ></path>
//                                                     </svg>
//                                                     Uploading...
//                                                 </div>
//                                             ) : uploadStatus === 'success' ? 'Posted!' : 'Post'}
//                                         </button>
//                                         <button 
//                                             className='px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto'
//                                             onClick={handleCancel}
//                                             disabled={uploadStatus === 'uploading'}
//                                         >
//                                             Cancel
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </motion.div>
//                     )}
//                 </AnimatePresence>
//             </div>
//         </div>
//     )
// }

// export default Post




















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
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [PostDetail, setPostDetail] = useState({
        heading: "",
        description: "",
        image: "",
    })
    const [PostContent, setPostContent] = useState("");
    const cancelRequest = useRef(null);

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
            type: "image",
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
            type: "video",
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
                image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                video: ['video/mp4', 'video/webm', 'video/ogg'],
                note: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            };

            if (!validTypes[PostContent]?.includes(selectedFile.type)) {
                setError(`Please select a valid ${PostContent} file type`);
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

    const handleSubmit = async () => {
        if (!PostDetail.heading.trim()) {
            setError("Please add a title for your content");
            return;
        }

        const form = new FormData();
        const Fid = auth.currentUser.uid;
        form.append('heading', PostDetail.heading.trim());
        form.append('description', PostDetail.description.trim());
        form.append('image', PostDetail.image);
        form.append('contentType', PostContent);
        
        setLoading(true);
        setUploadStatus('uploading');
        setPercent(0);

        try {
            cancelRequest.current = axios.CancelToken.source();
            
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/posts/${Fid}`, form, {
                headers: { "Content-Type": "multipart/form-data" },
                cancelToken: cancelRequest.current.token,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setPercent(percent);
                    }
                }
            });

            const result = await res.data;
            if (result) {
                setUploadStatus('success');
                setTimeout(() => {
                    ModelCloseClicked(false);
                }, 1500);
            } else {
                throw new Error(result.message || "Failed to upload");
            }
        } catch (err) {
            if (axios.isCancel(err)) {
                setUploadStatus('idle');
            } else {
                setError(err.response?.data?.message || "Upload failed. Please try again.");
                setUploadStatus('error');
            }
            setLoading(false);
        }
    }

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
        });
        setPreview(null);
        setUploadStatus('idle');
        setPercent(0);
        setPage(0);
        setError(null);
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
                className='relative lenis bg-neutral-900 rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl border border-neutral-700'
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

                {/* Progress Bar */}
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
                                                    {PostContent === "image" ? "JPG, PNG, GIF, WEBP" : 
                                                     PostContent === "video" ? "MP4, WEBM, OGG" : 
                                                     "PDF, TXT, DOC, DOCX"}
                                                </p>
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            onChange={handleFileChange}
                                            id='fileInput'
                                            name='image'
                                            accept={PostContent === "image" ? 'image/*' : PostContent === "video" ? "video/*" : '.pdf,.txt,.doc,.docx'}
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
                                        <span className="text-white text-sm font-medium">Uploading...</span>
                                        <span className="text-blue-500 text-sm font-bold">{Percent}%</span>
                                    </div>
                                    <div className="w-full bg-neutral-700 rounded-full h-2.5 mb-2">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${Percent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-neutral-400 text-xs">Please wait while we upload your file</p>
                                    <button 
                                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-full transition-colors"
                                        onClick={handleCancelUpload}
                                    >
                                        Cancel Upload
                                    </button>
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
                                        disabled={uploadStatus === 'uploading' || !PostDetail.heading.trim()}
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