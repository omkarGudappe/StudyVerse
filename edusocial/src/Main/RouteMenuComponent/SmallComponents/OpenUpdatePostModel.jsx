import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OpenUpdatePostModel = ({ post, onClose, onUpdate }) => {
    const [heading, setHeading] = useState(post?.heading || '');
    const [description, setDescription] = useState(post?.description || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [visibility, setVisibility] = useState(post?.visibility || 'public');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/posts/update/${post._id}`,
                {
                    heading: heading.trim(),
                    description: description.trim(),
                    visibility: visibility,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (res.data.ok) {
                const NewPost = {
                    ...post,
                    heading: res.data.post.heading,
                    description: res.data.post.description,
                    visibility: res.data.post.visibility,
                }
                onUpdate(NewPost);
                onClose();
            }
        } catch (err) {
            console.log(err.message);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to update post';
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-opacity-90 backdrop-blur-md" onClick={(e) => {onClose(); e.stopPropagation()}}>
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-neutral-900 border-b border-neutral-700 p-6 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Edit Post</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-neutral-800 rounded-xl transition-colors duration-200"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-red-200 text-sm flex-1">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-green-200 text-sm flex-1">{success}</p>
                        </div>
                    )}

                    <form onSubmit={(e)=> handleSubmit(e)} className="space-y-3">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-neutral-300">
                                Heading
                            </label>
                            <input
                                type="text"
                                value={heading}
                                onChange={(e) => setHeading(e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                placeholder="Enter post heading..."
                                maxLength={100}
                            />
                            <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">{heading.length}/100</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-neutral-300">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                placeholder="Enter post description..."
                                maxLength={500}
                            />
                            <div className="flex justify-between text-xs">
                                <span className="text-neutral-500">{description.length}/500</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-neutral-300">
                                Visibility
                            </label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                className="w-full bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="public">Public</option>
                                <option value="peers">Peers</option>
                            </select>
                            <div className="text-xs text-neutral-500">
                                {visibility === 'public' ? 'Visible to everyone' : 'Visible to your peers only'}
                            </div>
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-neutral-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!heading.trim() || loading}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-blue-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Updating...</span>
                                    </div>
                                ) : (
                                    'Update Post'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OpenUpdatePostModel;