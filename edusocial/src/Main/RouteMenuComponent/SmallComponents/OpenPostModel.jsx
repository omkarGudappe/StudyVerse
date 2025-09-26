import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns';

const OpenPostModal = ({ open, onClose, Id }) => {
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [activeTab, setActiveTab] = useState('post')
    const [commentInput, setCommentInput] = useState('')

    // Check screen size
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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

    const handleCommentSubmit = () => {
        // Placeholder for comment submission logic
        console.log("Submitting comment:", commentInput);
        setCommentInput('');
    };

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex md:items-center justify-center bg-black bg-opacity-90 backdrop-blur-md">
            <div className={`relative w-full max-w-6xl max-h-[90vh] bg-neutral-950 rounded-lg overflow-hidden flex ${isMobile ? 'flex-col h-full' : 'flex-row'}`}>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-white bg-neutral-800 rounded-full p-2 hover:bg-neutral-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {isMobile ? (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex items-center p-3 border-b border-neutral-800 bg-neutral-950">
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
                                                
                                                <button className="text-white hover:text-green-500 transition-colors">
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
                            <div className="p-4 border-b border-neutral-800 flex items-center space-x-3">
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
                                            className="w-10 h-10 rounded-full object-cover"
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
                            
                            <div className="p-4 border-b border-neutral-800">
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
        </div>
    )
}

export default OpenPostModal