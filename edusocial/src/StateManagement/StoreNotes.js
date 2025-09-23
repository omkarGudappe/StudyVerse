// import { create } from 'zustand'
// import axios from "axios";

// const StoreNotes = create((set) => ({
//     notes: null,
//     isLoading: false,
//     setNotes: (notesData) => set({ notes: notesData, isLoading: false }),
//     setLoading: (loading) => set({ isLoading: loading }),
//     clearNotes: () => set({ notes: null }),
// }))

// const usePostsStore = create((set, get) => ({
//   posts: [],
//   loading: false,
//   initialLoading: true,
//   error: null,
//   hasMore: true,
//   page: 1,
//   limit: 10,

//   clearPosts: () => set({ posts: [], page: 1, hasMore: true, initialLoading: false }),

//   addPost: (newPost) => set((state) => ({
//     posts: [newPost, ...state.posts]
//   })),

//   updatePostLikes: (postId, likes) => set((state) => ({
//     posts: state.posts.map(post =>
//       post._id === postId
//         ? { ...post, likes }
//         : post
//     )
//   })),

//   fetchPosts: async ( userId ,loadMore = false) => {
//     const currentState = get();
    
//     if (loadMore && !currentState.hasMore) return;
    
//     // if (!loadMore && currentState.posts.length > 0) return;

//     set({ loading: true, error: null, initialLoading: !loadMore });

//     try {
//       if(!userId) {
//         set({ loading: false, initialLoading: false });
//         return;
//       }
//       const pageToLoad = loadMore ? currentState.page + 1 : 1;
//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/posts/${userId}?page=${pageToLoad}&limit=${currentState.limit}`
//       );
      
//       if (response.data.ok) {
//         set((state) => ({
//           posts: loadMore 
//             ? [...state.posts, ...response.data.posts] 
//             : response.data.posts,
//           loading: false,
//           initialLoading: false,
//           page: pageToLoad,
//           hasMore: response.data.pagination.hasMore
//         }));
//       } else {
//         set({ error: response.data.message, loading: false, initialLoading: false });
//       }
//     } catch (err) {
//       console.error("Error fetching posts:", err);
//       set({ error: "Failed to load posts.", loading: false, initialLoading: false });
//     }
//   },

//   loadMorePosts: () => {
//     const state = get();
//     if (state.hasMore && !state.loading) {
//       state.fetchPosts(true);
//     }
//   }
// }));




// // Change the LessonStore creation to return a hook
// const createLessonStore = create((set, get) => ({
//   Lessons: [],
//   loading: false,
//   error: null,
//   hasMore: true,
//   page: 1,
//   limit: 10,

//   clearLesson: () => set({ Lessons: [], page: 1, hasMore: true }),

//   addLesson: (newLesson) => set((state) => ({
//     Lessons: [newLesson, ...state.Lessons]
//   })),

//   updateLessonLikes: (LessonId, likes) => set((state) => ({
//     Lessons: state.Lessons.map(lesson =>
//       lesson._id === LessonId
//         ? { ...lesson, likes }
//         : lesson
//     )
//   })),

//   fetchLesson: async (userId, loadMore = false) => {
//     const currentState = get();
    
//     if (loadMore && !currentState.hasMore) return;
    
//     if (!loadMore && currentState.Lessons.length > 0) return;

//     set({ loading: true, error: null });

//     try {
//       if(!userId) return;
//       const pageToLoad = loadMore ? currentState.page + 1 : 1;
//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/posts/lesson/${userId}?page=${pageToLoad}&limit=${currentState.limit}`
//       );
      
//       if (response.data.ok) {
//         set((state) => ({
//           Lessons: loadMore 
//             ? [...state.Lessons, ...response.data.lesson]
//             : response.data.lesson,
//           loading: false,
//           page: pageToLoad,
//           hasMore: response.data.pagination.hasMore
//         }));
//       } else {
//         set({ error: response.data.message, loading: false });
//       }
//     } catch (err) {
//       console.error("Error fetching Lessons:", err);
//       set({ error: "Failed to load Lessons.", loading: false });
//     }
//   },

//   loadMoreLesson: () => {
//     const state = get();
//     if (state.hasMore && !state.loading) {
//       state.fetchLesson(true);
//     }
//   }
// }));

// // Export the hook
// export const useLessonStore = createLessonStore;

// export { usePostsStore, StoreNotes }


















import { create } from 'zustand'
import axios from "axios";
import { persist, createJSONStorage } from 'zustand/middleware'

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;
const DEFAULT_LIMIT = 10;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Store for user notes
export const useNotesStore = create(
  persist(
    (set, get) => ({
      notes: null,
      isLoading: false,
      lastFetched: null,
      
      setNotes: (notesData) => set({ 
        notes: notesData, 
        isLoading: false,
        lastFetched: Date.now()
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      clearNotes: () => set({ notes: null, lastFetched: null }),
      
      // Fetch notes with caching
      fetchNotes: async (userId, forceRefresh = false) => {
        const state = get();
        
        // Return cached data if it's still valid and not forcing refresh
        if (!forceRefresh && state.notes && state.lastFetched && 
            (Date.now() - state.lastFetched) < CACHE_DURATION) {
          return state.notes;
        }
        
        set({ isLoading: true });
        
        try {
          if (!userId) {
            set({ isLoading: false });
            return null;
          }
          
          const response = await axios.get(
            `${API_BASE_URL}/notes/${userId}`
          );
          
          if (response.data.ok) {
            get().setNotes(response.data.notes);
            return response.data.notes;
          } else {
            throw new Error(response.data.message || 'Failed to fetch notes');
          }
        } catch (err) {
          console.error("Error fetching notes:", err);
          set({ isLoading: false });
          throw err;
        }
      },
      
      // Add a new note
      addNote: (newNote) => set((state) => ({
        notes: state.notes ? [newNote, ...state.notes] : [newNote]
      })),
      
      // Update an existing note
      updateNote: (noteId, updatedData) => set((state) => ({
        notes: state.notes ? state.notes.map(note => 
          note._id === noteId ? { ...note, ...updatedData } : note
        ) : null
      })),
      
      // Delete a note
      deleteNote: (noteId) => set((state) => ({
        notes: state.notes ? state.notes.filter(note => note._id !== noteId) : null
      }))
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notes: state.notes, lastFetched: state.lastFetched })
    }
  )
);

// Store for posts
export const usePostsStore = create((set, get) => ({
  posts: [],
  loading: false,
  initialLoading: true,
  error: null,
  hasMore: true,
  page: 1,
  limit: DEFAULT_LIMIT,
  lastFetched: null,

  // Clear all posts
  clearPosts: () => set({ 
    posts: [], 
    page: 1, 
    hasMore: true, 
    initialLoading: false,
    lastFetched: null 
  }),

  // Add a new post
  addPost: (newPost) => set((state) => ({
    posts: [newPost, ...state.posts]
  })),

  // Update post likes
  updatePostLikes: (postId, likes) => set((state) => ({
    posts: state.posts.map(post =>
      post._id === postId
        ? { ...post, likes }
        : post
    )
  })),

  // Add a comment to a post
  addCommentToPost: (postId, comment) => set((state) => ({
    posts: state.posts.map(post =>
      post._id === postId
        ? { 
            ...post, 
            comments: post.comments ? [...post.comments, comment] : [comment],
            commentCount: (post.commentCount || 0) + 1
          }
        : post
    )
  })),

  removeCommentFromPost: (postId, commentId) => set((state) => ({
    posts: state.posts.map(post =>
      post._id === postId
        ? { 
            ...post, 
            comments: post.comments ? post.comments.filter(c => c._id !== commentId) : [],
            commentCount: Math.max(0, (post.commentCount || 0) - 1)
          }
        : post
    )
  })),

  // Delete a post
  deletePost: (postId) => set((state) => ({
    posts: state.posts.filter(post => post._id !== postId)
  })),

  // Fetch posts with pagination and caching
  fetchPosts: async (userId, loadMore = false, forceRefresh = false) => {
    const currentState = get();
    
    if (loadMore && !currentState.hasMore) return;
    
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && !loadMore && currentState.posts.length > 0 && 
        currentState.lastFetched && (Date.now() - currentState.lastFetched) < CACHE_DURATION) {
      return currentState.posts;
    }

    set({ 
      loading: true, 
      error: null, 
      initialLoading: !loadMore 
    });

    try {
      if (!userId) {
        set({ loading: false, initialLoading: false });
        return;
      }
      
      const pageToLoad = loadMore ? currentState.page + 1 : 1;
      const response = await axios.get(
        `${API_BASE_URL}/posts/${userId}?page=${pageToLoad}&limit=${currentState.limit}`
      );
      
      if (response.data.ok) {
        set((state) => ({
          posts: loadMore 
            ? [...state.posts, ...response.data.posts] 
            : response.data.posts,
          loading: false,
          initialLoading: false,
          page: pageToLoad,
          hasMore: response.data.pagination.hasMore,
          lastFetched: Date.now()
        }));
        console.log("get respinse ", response.data.posts);
        return response.data.posts;
      } else {
        throw new Error(response.data.message || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      const errorMsg = err.response?.data?.message || "Failed to load posts.";
      set({ error: errorMsg, loading: false, initialLoading: false });
      throw err;
    }
  },

  // Load more posts
  loadMorePosts: (userId) => {
    const state = get();
    if (state.hasMore && !state.loading) {
      state.fetchPosts(userId, true);
    }
  },

  // Refresh posts
  refreshPosts: (userId) => {
    get().fetchPosts(userId, false, true);
  }
}));

// Store for lessons
export const useLessonStore = create((set, get) => ({
  Lessons: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: DEFAULT_LIMIT,
  lastFetched: null,

  // Clear all lessons
  clearLesson: () => set({ 
    Lessons: [], 
    page: 1, 
    hasMore: true,
    lastFetched: null 
  }),

  // Add a new lesson
  addLesson: (newLesson) => set((state) => ({
    Lessons: [newLesson, ...state.Lessons]
  })),

  // Update lesson likes
  updateLessonLikes: (LessonId, likes) => set((state) => ({
    Lessons: state.Lessons.map(lesson =>
      lesson._id === LessonId
        ? { ...lesson, likes }
        : lesson
    )
  })),

  // Add a comment to a lesson
  addCommentToLesson: (lessonId, comment) => set((state) => ({
    Lessons: state.Lessons.map(lesson =>
      lesson._id === lessonId
        ? { 
            ...lesson, 
            comments: lesson.comments ? [...lesson.comments, comment] : [comment],
            commentCount: (lesson.commentCount || 0) + 1
          }
        : lesson
    )
  })),

  // Remove a comment from a lesson
  removeCommentFromLesson: (lessonId, commentId) => set((state) => ({
    Lessons: state.Lessons.map(lesson =>
      lesson._id === lessonId
        ? { 
            ...lesson, 
            comments: lesson.comments ? lesson.comments.filter(c => c._id !== commentId) : [],
            commentCount: Math.max(0, (lesson.commentCount || 0) - 1)
          }
        : lesson
    )
  })),

  // Delete a lesson
  deleteLesson: (lessonId) => set((state) => ({
    Lessons: state.Lessons.filter(lesson => lesson._id !== lessonId)
  })),

  // Fetch lessons with pagination and caching
  fetchLesson: async (userId, loadMore = false, forceRefresh = false) => {
    const currentState = get();
    
    if (loadMore && !currentState.hasMore) return;
    
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && !loadMore && currentState.Lessons.length > 0 && 
        currentState.lastFetched && (Date.now() - currentState.lastFetched) < CACHE_DURATION) {
      return currentState.Lessons;
    }

    set({ loading: true, error: null });

    try {
      if (!userId) {
        set({ loading: false });
        return;
      }
      
      const pageToLoad = loadMore ? currentState.page + 1 : 1;
      const response = await axios.get(
        `${API_BASE_URL}/posts/lesson/${userId}?page=${pageToLoad}&limit=${currentState.limit}`
      );
      
      if (response.data.ok) {
        set((state) => ({
          Lessons: loadMore 
            ? [...state.Lessons, ...response.data.lesson]
            : response.data.lesson,
          loading: false,
          page: pageToLoad,
          hasMore: response.data.pagination.hasMore,
          lastFetched: Date.now()
        }));
        
        return response.data.lesson;
      } else {
        throw new Error(response.data.message || 'Failed to fetch lessons');
      }
    } catch (err) {
      console.error("Error fetching Lessons:", err);
      const errorMsg = err.response?.data?.message || "Failed to load lessons.";
      set({ error: errorMsg, loading: false });
      throw err;
    }
  },

  // Load more lessons
  loadMoreLesson: (userId) => {
    const state = get();
    if (state.hasMore && !state.loading) {
      state.fetchLesson(userId, true);
    }
  },

  // Refresh lessons
  refreshLessons: (userId) => {
    get().fetchLesson(userId, false, true);
  },

  getLessonById: (lessonId) => {
    const state = get();
    return state.Lessons.find(lesson => lesson._id === lessonId);
  },

  searchLessons: (keyword) => {
    const state = get();
    if (!keyword) return state.Lessons;
    
    const searchTerm = keyword.toLowerCase();
    return state.Lessons.filter(lesson => 
      lesson.heading?.toLowerCase().includes(searchTerm) ||
      lesson.description?.toLowerCase().includes(searchTerm) ||
      lesson.author?.firstName?.toLowerCase().includes(searchTerm) ||
      lesson.author?.lastName?.toLowerCase().includes(searchTerm)
    );
  }
}));

export const useCombinedStore = create((set, get) => ({
  refreshAll: (userId) => {
    usePostsStore.getState().refreshPosts(userId);
    useLessonStore.getState().refreshLessons(userId);
    useNotesStore.getState().fetchNotes(userId, true);
  },
  
  clearAll: () => {
    usePostsStore.getState().clearPosts();
    useLessonStore.getState().clearLesson();
    useNotesStore.getState().clearNotes();
  },
  
  getStats: () => {
    const posts = usePostsStore.getState().posts;
    const lessons = useLessonStore.getState().Lessons;
    const notes = useNotesStore.getState().notes;
    
    return {
      postCount: posts.length,
      lessonCount: lessons.length,
      noteCount: notes ? notes.length : 0,
      totalLikes: [
        ...posts.flatMap(post => post.likes || []),
        ...lessons.flatMap(lesson => lesson.likes || [])
      ].length
    };
  }
}));