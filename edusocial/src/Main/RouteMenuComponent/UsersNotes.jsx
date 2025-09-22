import React, { useState, useEffect } from 'react'
import UserNotesPanel from './Panels/UserNotesPanel'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom';

const UsersNotes = ({ open, onClose, ProfileData , from }) => {
    const [Notes, setNotes] = useState([]);
    const [error, setError] = useState(null);
    const [Loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const FetchNotes = async () => {
            if (!open || !ProfileData?._id) return;
            console.log("check");
            
            const ID = ProfileData._id;
            setLoading(true);
            setError(null);
            
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/Notes/usernotes/${ID}`)
                if (res.data.ok) {
                    setNotes(res.data.notes);
                } else {
                    throw new Error(res.data.message || "Failed to fetch notes");
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Failed to load notes");
                console.error("Error fetching notes:", err);
            } finally {
                setLoading(false);
            }
        }
        FetchNotes();
    }, [open]);

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        
        setDeletingId(noteId);
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/Notes/delete/${noteId}`);
            setNotes(prev => prev.filter(note => note.NoteId !== noteId));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete note");
            console.error("Error deleting note:", err);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    };

    const truncateText = (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

        const handleNoteClick = (note) => {
        navigate(`/notes/${note?.NoteId}`, {
            state: {
                content: note.content,
                Id: note?._id,
            }
        });
    };

    const NoteSkeleton = () => (
        <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-neutral-800 rounded-2xl border border-neutral-700">
                    <div className="w-12 h-12 bg-neutral-700 rounded-xl flex-shrink-0"></div>
                    <div className="flex-1 space-y-3">
                        <div className="h-5 bg-neutral-700 rounded w-3/4"></div>
                        <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
                        <div className="h-3 bg-neutral-700 rounded w-1/4"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const NoteCard = ({ note, index }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-neutral-800 rounded-2xl border border-neutral-700 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden"
        >
            <button 
                onClick={() => handleNoteClick(note)}
                className="block p-6 pr-16 hover:bg-neutral-750 transition-colors duration-200"
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-600 to-amber-600 rounded-xl flex items-center justify-center">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="w-6 h-6 text-white" 
                            fill="none" 
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                            />
                        </svg>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg mb-2 truncate">
                            {note?.title}
                        </h3>
                        
                        {note?.description && (
                            <p className="text-neutral-400 text-sm mb-3 line-clamp-2">
                                {truncateText(note.description)}
                            </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                            {note?.createdAt && (
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(note.createdAt)}
                                </span>
                            )}
                            
                            {note?.category && (
                                <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs">
                                    {note.category}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteNote(note.NoteId);
                }}
                disabled={deletingId === note.NoteId}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-neutral-400 hover:text-red-400 transition-colors duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Delete note"
            >
                {deletingId === note.NoteId ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                )}
            </button>
        </motion.div>
    );

    return (
        <UserNotesPanel
            open={open}
            onClose={onClose}
            Notes={Notes}
            from={from}
        >
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Your Notes</h2>
                    <p className="text-neutral-400">
                        {Notes.length} note{Notes.length !== 1 ? 's' : ''} created
                    </p>
                </div>

                {Loading ? (
                    <NoteSkeleton />
                ) : error ? (
                    <div className="text-center py-12 px-6">
                        <div className="bg-red-500/10 p-6 rounded-2xl mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-400 mb-4 text-lg">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : Notes.length > 0 ? (
                    <div className="grid gap-4">
                        {Notes.map((note, index) => (
                            <NoteCard key={note.NoteId} note={note} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="bg-neutral-800/50 p-8 rounded-2xl border border-neutral-700">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-amber-600 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold text-xl mb-3">No notes yet</h3>
                            <p className="text-neutral-400 mb-6">
                                Start creating your first note to organize your thoughts and ideas!
                            </p>
                            <Link
                                to="/createNotes"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-amber-700 transition-all duration-200"
                                onClick={onClose}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Your First Note
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </UserNotesPanel>
    )
}

export default UsersNotes