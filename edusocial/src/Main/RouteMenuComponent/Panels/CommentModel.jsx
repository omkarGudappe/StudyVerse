import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios';
import { UserDataContextExport } from '../CurrentUserContexProvider';

const CommentModel = ({ open, postId, onClose, PostownerId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState("");
    const { ProfileData } = UserDataContextExport();

    const handleAddComment = async () => {
        try {
            if (!newComment.trim()) return;
            if (!ProfileData?._id) {
                console.log("User not logged in");
                return;
            }

            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/posts/comments/${postId}`,
                {
                    userId: ProfileData._id,
                    comment: newComment.trim(),
                    PostownerId: PostownerId,
                }
            );

            if (res.data.ok) {
                setComments(prev => [res.data.comment, ...prev]);
                setNewComment("");

            }
        } catch (err) {
            console.log(err?.response?.data?.message || err.message);
        }
    };

    useEffect(() => {
        const FetchComments = async () => {
            try {
                if (!postId || !open) return;
                
                setLoading(true);
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/comments/${postId}`);
                
                console.log('API Response:', res.data);
                
                if (res.data.ok) {
                    let commentsData = res.data.comments;
                    
                    if (Array.isArray(commentsData)) {
                        setComments(commentsData);
                    } else if (commentsData && Array.isArray(commentsData.comments)) {
                        setComments(commentsData.comments);
                    } else {
                        console.error('Unexpected comments format:', commentsData);
                        setComments([]);
                    }
                }
            } catch (err) {
                console.log('Error:', err?.response?.data || err.message);
                setComments([]);
            } finally {
                setLoading(false);
            }
        }
        
        if (open) {
            FetchComments();
        } else {
            setComments([]);
            setNewComment("");
        }
    }, [postId, open]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-neutral-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-neutral-700/30">
                    <h3 className="text-xl font-semibold text-white">Comments</h3>
                    <button 
                        onClick={onClose}
                        className="text-neutral-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                            <p className="text-neutral-400 mt-2">Loading comments...</p>
                        </div>
                    ) : !Array.isArray(comments) || comments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-700/30 rounded-2xl mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-neutral-400">No comments yet</p>
                            <p className="text-neutral-500 text-sm mt-1">Be the first to comment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment._id} className="bg-neutral-700/30 p-4 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        {comment.author?.avatar ? (
                                            <img 
                                                src={comment.author.avatar} 
                                                alt={`${comment.author.firstName} ${comment.author.lastName}`}
                                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-white font-medium text-sm">
                                                    {comment.author?.firstName} {comment.author?.lastName}
                                                </h4>
                                                <span className="text-neutral-400 text-xs">
                                                    {new Date(comment.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-neutral-300 text-sm">{comment.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-neutral-700/30 rounded-bl-2xl rounded-br-2xl bg-neutral-800/50 backdrop-blur-sm flex-shrink-0">
                    <div className="flex gap-2">
                        <input
                            onChange={(e) => setNewComment(e.target.value)}
                            value={newComment}
                            type="text"
                            placeholder="Add a comment..."
                            className="flex-1 bg-neutral-700/50 border border-neutral-600 rounded-xl px-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:border-purple-500 text-sm"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddComment();
                                }
                            }}
                        />
                        <button 
                            onClick={handleAddComment} 
                            disabled={!newComment.trim()}
                            className="bg-gradient-to-r from-purple-600 to-amber-500 px-4 py-3 rounded-xl text-white font-medium hover:from-purple-500 hover:to-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CommentModel;