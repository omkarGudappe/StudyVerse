import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNotesStore } from '../../../StateManagement/StoreNotes';
import { UserDataContextExport } from '../CurrentUserContexProvider';
import { auth } from '../../../Auth/AuthProviders/FirebaseSDK';

const NotesTitle = ({ open, onClose , editor }) => {
  const [title, setTitle] = useState('');
  const [IsLoading, setIsLoading] = useState(false);
  const Navigate = useNavigate();
  const { setNotes, setLoading } = useNotesStore();
  const { ProfileData , FirebaseUid } = UserDataContextExport();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!title) return;

    setLoading(true);
    setIsLoading(true);
    // if (title.trim()) {
    //   setTitle('');
    //   onClose();
    // }
    const userId = FirebaseUid || auth.currentUser?.uid || ProfileData?.Uid || ProfileData?.firebaseUid
    const NoteId = title +"_"+ Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const content = editor.getJSON();
    console.log("Form data", title, userId, NoteId, content);
    try{
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/Notes/usernotes`,{ title, NoteId, uid:userId, content } );
        if(res.data.ok){
            setNotes({ title, id: NoteId });
            onClose();
        }else {
            console.log(res.data.message);
            setLoading(false);
        }
        setIsLoading(false);
    }catch(err){
        console.log(err?.response?.data?.message || err.message);
    }finally{
        setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  if (!open) return null;

  return (
    <>
        {open && 
            <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
                <div 
                    className='absolute inset-0 bg-black/70 backdrop-blur-sm'
                    onClick={handleClose}
                />
                
                <div className='relative bg-neutral-800 rounded-2xl w-full max-w-md mx-auto shadow-2xl border border-neutral-600'>
                    <button
                    onClick={handleClose}
                    className='absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors'
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </button>

                    <form onSubmit={handleSubmit} className='p-8'>
                    <div className='text-center mb-8'>
                        <h1 className='text-2xl font-bold text-white mb-2'>Enter Notes Title</h1>
                        <p className='text-neutral-400 text-sm'>Give your notes a descriptive title</p>
                    </div>
                    
                    <div className='mb-8'>
                        <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className='w-full bg-neutral-700 border-2 border-neutral-600 rounded-xl px-6 py-4 text-white placeholder-neutral-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 outline-none transition-all duration-200'
                        placeholder='e.g., Calculus Notes, Physics Formulas...'
                        autoFocus
                        />
                    </div>
                    
                    <div className='flex gap-4 justify-center'>
                        <button
                        type='button'
                        onClick={handleClose}
                        className='px-8 py-3 bg-neutral-700 text-white rounded-xl font-medium hover:bg-neutral-600 transition-colors duration-200 min-w-[120px]'
                        >
                        Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={IsLoading}
                            className="bg-purple-600 text-white cursor-pointer px-2 py-2 rounded-lg font-semibold text-lg min-w-40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {IsLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Working...
                                </div>
                            ) : "Set Title"}
                        </button>
                    </div>
                    </form>
                </div>
            </div>
        }
    </>
  )
}

export default NotesTitle