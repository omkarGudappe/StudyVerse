import { create } from 'zustand'
import axios from "axios";

const StoreNotes = create((set) => ({
    notes: null,
    isLoading: false,
    setNotes: (notesData) => set({ notes: notesData, isLoading: false }),
    setLoading: (loading) => set({ isLoading: loading }),
    clearNotes: () => set({ notes: null }),
}))


const usePostsStore = create((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  clearPosts: () => set({ posts: [] }),

  fetchPosts: async () => {
    if (get().posts.length > 0) return;

    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts`);
      if (response.data.ok) {
        set({ posts: response.data.posts.reverse() });
      } else {
        set({ error: response.data.message });
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      set({ error: "Failed to load posts." });
    } finally {
      set({ loading: false });
    }
  },
}));

export {usePostsStore , StoreNotes}
