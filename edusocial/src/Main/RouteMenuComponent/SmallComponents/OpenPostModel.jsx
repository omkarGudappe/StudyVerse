import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns';
import { UserDataContextExport } from '../CurrentUserContexProvider';
import OpenUpdatePostModel from './OpenUpdatePostModel';
import Share from './Share';
import Socket from '../../../SocketConnection/Socket';
import AddComment from '../Functions/AddComment';

const OpenPostModal = ({ open, onClose, Id, posts = [], UpdatePosts, from = '' }) => {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [activeTab, setActiveTab] = useState('post')
    const [commentInput, setCommentInput] = useState('')
    const [OpenMenu, setOpenMenu] = useState({});
    const [OpenEditPostModel ,setOpenEditPostModel] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [shareModalOpen, setShareModalOpen] = useState({
        isOpen: false,
        post: null,
    });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const btnRef = useRef(null);
    const dropdownRef = useRef(null);

      useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [open]);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const showError = (message) => {
        setError(message);
        setSuccess('');
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError('');
    };

     const handleSharePost = (post) => {
        setShareModalOpen({ isOpen: true, post });
        Socket.emit("SendContactUsers", { ID: ProfileData?._id });
    };

    const { ProfileData } = UserDataContextExport();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
      function handleClickOutside(e) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target) &&
          btnRef.current &&
          !btnRef.current.contains(e.target)
        ) {
          setOpenMenu({});
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchPostDetail = async () => {
            if (!Id) return
            
            try {
                setLoading(true)
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/single/${Id}`)

                if (res.data.ok) {
                    setPost(res.data.Post)
                }
            } catch (err) {
                console.log(err?.response?.data?.message || err.message)
            } finally {
                setLoading(false)
            }
        }
        
        if (open) {
            fetchPostDetail()
            setActiveTab('post')
        }
    }, [Id, open])

    const handleCommentSubmit = async () => {
        console.log("Submitting comment:", commentInput);
        const Result = await AddComment(post?._id, commentInput, post?.author?._id, ProfileData?._id);

        if (Result.ok) {
            const NewComment = Result.res;
            const AddNewComment = {
                _id: NewComment?._id,
                user: {
                    UserProfile: {
                    avatar: { url: NewComment?.author?.avatar }
                    },
                    username: NewComment?.author?.username,
                    firstName: NewComment?.author?.firstName,
                    lastName: NewComment?.author?.lastName
                },
                comment: NewComment?.content,
                createdAt: NewComment?.createdAt,
            };
            setPost(prevPost => ({
                ...prevPost,
                comments: [AddNewComment, ...(prevPost.comments || [])]
            }));
        } else {
            console.log(Result.err)
        }
        setCommentInput('');
    };

    const handleDeleteClick = (post) => {
        setPostToDelete(post);
        setDeleteConfirmOpen(true);
        setOpenMenu({});
    };

    const handleDeletePost = async () => {
        if (!postToDelete?._id) return;
        setLoading(true);
        try{
            const token = localStorage.getItem('token');
            const res = await axios.delete(
                `${import.meta.env.VITE_API_URL}/posts/delete/${postToDelete._id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            )

            if(res.data.ok) {
               const newPosts = posts.filter(post => post._id !== postToDelete._id);
               UpdatePosts(newPosts);
               setDeleteConfirmOpen(false);
               setPostToDelete(null);
               onClose();
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to delete post';
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdate = (updatedPost) => {
        console.log(updatedPost, "posts");
        const NewUpdatedPosts = posts.filter(post => post._id === updatedPost._id)
        console.log("debbugging", NewUpdatedPosts);
        setPost(updatedPost);
        setOpenEditPostModel(false);
    }

    const MenuButton = () => {
        return (
          <>
             {ProfileData?._id === post?.author?._id && from === 'Profile' && (
                <div className='relative'>
                    <button
                        ref={btnRef}
                        onClick={() => setOpenMenu({status: true, id: post?._id})} 
                        className="z-10 text-white rounded-full p-2 hover:bg-neutral-700 transition-colors"
                    >
                        ⋮
                    </button>
                    {OpenMenu.status && (
                        <div ref={dropdownRef} className='absolute right-4 bg-neutral-800 rounded-2xl'>
                            <div className='flex flex-col w-30 gap-1 h-full'>
                                <button 
                                    className='rounded-tl-2xl rounded-tr-2xl p-2 hover:bg-neutral-900/50 w-full h-full '
                                    onClick={() => setOpenEditPostModel(true)}
                                >
                                    Edit
                                </button>
                                <button
                                    className=' p-2 hover:bg-neutral-900/50 w-full h-full'
                                    onClick={() => handleSharePost(post)}
                                >
                                    Share
                                </button>
                                <button 
                                    className='rounded-bl-2xl rounded-br-2xl text-red-500 p-2 hover:bg-red-400/50 w-full h-full '
                                    onClick={() => handleDeleteClick(post)}
                                    disabled={loading}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </>
        )
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex md:items-center justify-center bg-opacity-90 backdrop-blur-md" onClick={(e) => {onClose(); e.stopPropagation()}}>
            <div className={`relative w-full max-w-6xl max-h-[100vh] bg-neutral-950 rounded-lg overflow-hidden flex ${isMobile ? 'flex-col h-full' : 'flex-row'}`} onClick={(e) => e.stopPropagation()}>
                
                {isMobile ? (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex justify-between items-center p-3 border-b border-neutral-800 bg-neutral-950">
                            <div className='flex items-center'>
                                <button 
                                    onClick={onClose}
                                    className="text-white p-2 mr-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <h2 className="text-white font-semibold">
                                    {loading ? "Loading..." : "Post"}
                                </h2>
                            </div>

                           <MenuButton/>
                        </div>
                        
                        <div className="flex border-b border-neutral-800 bg-neutral-950">
                            <button 
                                className={`flex-1 py-3 text-center font-medium ${activeTab === 'post' ? 'text-white border-b-2 border-white' : 'text-neutral-400'}`}
                                onClick={() => setActiveTab('post')}
                            >
                                Post
                            </button>
                            <button 
                                className={`flex-1 py-3 text-center font-medium ${activeTab === 'comments' ? 'text-white border-b-2 border-white' : 'text-neutral-400'}`}
                                onClick={() => setActiveTab('comments')}
                            >
                                Comments ({post?.comments?.length || 0})
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'post' ? (
                                <>
                                    <div className="flex items-center justify-center bg-black aspect-square">
                                        {loading ? (
                                            <div className="w-full h-full bg-neutral-900 animate-pulse"></div>
                                        ) : post?.files?.type === 'video' ? (
                                            <video 
                                                src={post.files.url} 
                                                controls 
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <img 
                                                src={post?.files?.url} 
                                                alt={post?.heading} 
                                                className="w-full h-full object-contain"
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="sticky bottom-0 bg-neutral-950 border-t border-neutral-800 p-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex space-x-4">
                                                <button className="text-white hover:text-red-500 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                </button>
                                                
                                                <button 
                                                    className="text-white hover:text-blue-500 transition-colors"
                                                    onClick={() => setActiveTab('comments')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </button>
                                                
                                                <button 
                                                    className="text-white hover:text-green-500 transition-colors"
                                                    onClick={()=>handleSharePost(post)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            
                                            {loading ? (
                                                <div className="h-4 w-10 bg-neutral-800 animate-pulse rounded"></div>
                                            ) : (
                                                <p className="text-white font-medium">
                                                    {post?.likes?.length || 0} likes
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="flex space-x-2">
                                            <input 
                                                type="text" 
                                                placeholder="Add a comment..." 
                                                value={commentInput}
                                                onChange={(e) => setCommentInput(e.target.value)}
                                                onKeyUp={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleCommentSubmit();
                                                    }
                                                }}
                                                className="flex-1 bg-neutral-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                            <button 
                                                className="text-blue-500 font-semibold px-3 hover:text-blue-400 transition-colors disabled:text-blue-800"
                                                disabled={!commentInput.trim()}
                                                onClick={handleCommentSubmit}
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4">
                                        <div className="flex items-center space-x-3 mb-3">
                                            {loading ? (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse"></div>
                                                    <div className="flex flex-col space-y-2">
                                                        <div className="h-4 w-32 bg-neutral-800 animate-pulse rounded"></div>
                                                        <div className="h-3 w-24 bg-neutral-800 animate-pulse rounded"></div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <img 
                                                        src={post?.author?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                                        alt={post?.author?.firstName} 
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-neutral-700"
                                                    />
                                                    <div>
                                                        <h3 className="text-white font-semibold">
                                                            {post?.author?.firstName} {post?.author?.lastName}
                                                        </h3>
                                                        <p className="text-neutral-400 text-sm">{post?.author?.username}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        
                                        <div>
                                            {loading ? (
                                                <div className="space-y-2">
                                                    <div className="h-4 w-full bg-neutral-800 animate-pulse rounded"></div>
                                                    <div className="h-4 w-3/4 bg-neutral-800 animate-pulse rounded"></div>
                                                </div>
                                            ) : (
                                                <>
                                                    <h2 className="text-white font-bold text-lg mb-2">{post?.heading}</h2>
                                                    <p className="text-neutral-300">{post?.description}</p>
                                                </>
                                            )}
                                        </div>
                                        
                                        {loading ? (
                                            <div className="h-3 w-24 bg-neutral-800 animate-pulse rounded mt-2"></div>
                                        ) : (
                                            <p className="text-neutral-400 text-xs mt-2">
                                                {formatDistanceToNow(new Date(post?.createdAt), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-4">
                                    <h4 className="text-white font-semibold mb-4">Comments ({post?.comments?.length || 0})</h4>
                                    
                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="flex space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-32 bg-neutral-800 animate-pulse rounded"></div>
                                                        <div className="h-4 w-full bg-neutral-800 animate-pulse rounded"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : post?.comments?.length > 0 ? (
                                        <div className="space-y-4">
                                            {post?.comments?.map(comment => (
                                                <div key={comment?._id} className="flex justify-between">
                                                    <div className='flex space-x-3'>
                                                        <img 
                                                            src={comment?.user?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                                            alt={comment?.user?.firstName}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                        <div>
                                                            <p className="text-white font-medium">
                                                                {comment?.user?.firstName} {comment?.user?.lastName}
                                                            </p>
                                                            <p className="text-neutral-400 text-sm">{comment?.comment}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className='text-sm text-neutral-600'>{formatDistanceToNow(new Date(comment?.createdAt), { addSuffix: true })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <p className="text-neutral-500">No comments yet</p>
                                            <p className="text-neutral-600 text-sm mt-1">Be the first to comment</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="md:w-7/12 bg-black flex items-center justify-center p-4">
                            {loading ? (
                                <div className="w-full h-96 bg-neutral-900 animate-pulse rounded"></div>
                            ) : post?.files?.type === 'video' ? (
                                <video 
                                    src={post.files.url} 
                                    controls
                                    className="max-h-[80vh] w-full object-contain"
                                />
                            ) : (
                                <img 
                                    src={post?.files?.url} 
                                    alt={post?.heading} 
                                    className="max-h-[80vh] w-full object-contain"
                                />
                            )}
                        </div>
                        
                        <div className="md:w-5/12 flex flex-col border-l border-neutral-800">
                            <div className="p-4 border-b border-neutral-800 flex items-center justify-between w-full space-x-3">
                                {loading ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse"></div>
                                        <div className="flex flex-col space-y-2">
                                            <div className="h-4 w-32 bg-neutral-800 animate-pulse rounded"></div>
                                            <div className="h-3 w-24 bg-neutral-800 animate-pulse rounded"></div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className='flex gap-2 items-center'>
                                            <img 
                                                src={post?.author?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                                alt={post?.author?.firstName} 
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <h3 className="text-white font-semibold">
                                                    {post?.author?.firstName} {post?.author?.lastName}
                                                </h3>
                                                <p className="text-neutral-400 text-sm">{post?.author?.username}</p>
                                            </div>
                                        </div>
                                        <MenuButton/>
                                    </>
                                )}
                            </div>
                            
                            <div className="p-4 border-b border-neutral-800">
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-neutral-800 animate-pulse rounded"></div>
                                        <div className="h-4 w-3/4 bg-neutral-800 animate-pulse rounded"></div>
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-white font-bold text-lg mb-2">{post?.heading}</h2>
                                        <div className='overflow-y-auto text-wrap max-h-20'>
                                            <p className="text-neutral-300">{post?.description}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4">
                                <h4 className="text-white font-semibold mb-4">Comments</h4>
                                
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 w-32 bg-neutral-800 animate-pulse rounded"></div>
                                                    <div className="h-4 w-full bg-neutral-800 animate-pulse rounded"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : post?.comments?.length > 0 ? (
                                    <div className="space-y-4">
                                        {post?.comments?.map(comment => (
                                            <div key={comment?._id} className="flex justify-between">
                                                <div className='flex space-x-3'>
                                                    <img 
                                                        src={comment?.user?.UserProfile?.avatar?.url || '/default-avatar.png'} 
                                                        alt={comment?.user?.firstName}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {comment?.user?.firstName} {comment?.user?.lastName}
                                                        </p>
                                                        <p className="text-neutral-400 text-sm">{comment?.comment}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className='text-sm text-neutral-600'>{formatDistanceToNow(new Date(comment?.createdAt), { addSuffix: true })}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        <p className="text-neutral-500">No comments yet</p>
                                        <p className="text-neutral-600 text-sm mt-1">Be the first to comment</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-4 border-t border-neutral-800">
                                <div className="flex justify-between mb-4">
                                    <div className="flex space-x-4">
                                        <button className="text-white hover:text-red-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                        
                                        <button className="text-white hover:text-blue-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </button>
                                        
                                        <button className="text-white hover:text-green-500 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                {loading ? (
                                    <div className="h-4 w-20 bg-neutral-800 animate-pulse rounded mb-2"></div>
                                ) : (
                                    <p className="text-white font-semibold mb-2">
                                        {post?.likes?.length || 0} likes
                                    </p>
                                )}
                                
                                {loading ? (
                                    <div className="h-3 w-24 bg-neutral-800 animate-pulse rounded"></div>
                                ) : (
                                    <p className="text-neutral-400 text-xs">
                                        {formatDistanceToNow(new Date(post?.createdAt), { addSuffix: true })}
                                    </p>
                                )}
                            </div>
                            
                            <div className="p-4 border-t border-neutral-800">
                                <div className="flex space-x-2">
                                    <input 
                                        type="text" 
                                        placeholder="Add a comment..." 
                                        value={commentInput}
                                        onChange={(e) => setCommentInput(e.target.value)}
                                        onKeyUp={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCommentSubmit();
                                            }
                                        }}
                                        className="flex-1 bg-neutral-900 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button 
                                        className="text-blue-500 font-semibold px-3 hover:text-blue-400 transition-colors disabled:text-blue-800"
                                        disabled={!commentInput.trim()}
                                        onClick={handleCommentSubmit}
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {OpenEditPostModel && (
                 <OpenUpdatePostModel
                        post={post}
                        onClose={() => setOpenEditPostModel(false)}
                        onUpdate={handleUpdate}
                />
            )}
            {shareModalOpen.isOpen && (
                <Share
                onClose={() => setShareModalOpen({ isOpen: false, post: null })}
                shareModalOpen={shareModalOpen}
                ProfileData={ProfileData}
                />
            )}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-opacity-80 backdrop-blur-sm"  onClick={(e) => {setDeleteConfirmOpen(false); e.stopPropagation()}}>
                    <div className="bg-neutral-900 rounded-2xl p-6 mx-4 max-w-md w-full border border-neutral-700 shadow-2xl transform transition-all" onClick={(e)=> e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Delete Post</h3>
                            <p className="text-neutral-400">Are you sure you want to delete this post? This action cannot be undone.</p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeletePost}
                                disabled={loading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Deleting...</span>
                                    </div>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OpenPostModal