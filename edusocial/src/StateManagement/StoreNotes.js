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
  hasMore: true,
  page: 1,
  limit: 10,

  clearPosts: () => set({ posts: [], page: 1, hasMore: true }),

  addPost: (newPost) => set((state) => ({
    posts: [newPost, ...state.posts]
  })),

  updatePostLikes: (postId, likes) => set((state) => ({
    posts: state.posts.map(post =>
      post._id === postId
        ? { ...post, likes }
        : post
    )
  })),

  fetchPosts: async ( userId ,loadMore = false) => {
    const currentState = get();
    
    // If loading more and no more posts, return
    if (loadMore && !currentState.hasMore) return;
    
    if (!loadMore && currentState.posts.length > 0) return;

    set({ loading: true, error: null });

    try {
      if(!userId) return;
      const pageToLoad = loadMore ? currentState.page + 1 : 1;
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/posts/${userId}?page=${pageToLoad}&limit=${currentState.limit}`
      );
      
      if (response.data.ok) {
        set((state) => ({
          posts: loadMore 
            ? [...state.posts, ...response.data.posts] 
            : response.data.posts,
          loading: false,
          page: pageToLoad,
          hasMore: response.data.pagination.hasMore
        }));
      } else {
        set({ error: response.data.message, loading: false });
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      set({ error: "Failed to load posts.", loading: false });
    }
  },

  loadMorePosts: () => {
    const state = get();
    if (state.hasMore && !state.loading) {
      state.fetchPosts(true);
    }
  }
}));

export {usePostsStore , StoreNotes}