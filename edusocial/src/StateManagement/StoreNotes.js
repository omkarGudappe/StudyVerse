// StoreNotes.js
import { create } from 'zustand'

const StoreNotes = create((set) => ({
    notes: null,
    isLoading: false,
    setNotes: (notesData) => set({ notes: notesData, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
    clearNotes: () => set({ notes: null }),
}))

export default StoreNotes