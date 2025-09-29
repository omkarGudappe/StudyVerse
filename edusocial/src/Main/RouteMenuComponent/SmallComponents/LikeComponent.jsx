import React, {useState, useEffect} from 'react'
import Socket from '../../../SocketConnection/Socket';
import { usePostsStore, useLessonStore } from '../../../StateManagement/StoreNotes';


const LikeComponent = ({PostId, PostAuthorId , LikeLength, CurrentUserId, isVideo=false }) => {

      const [pendingLikes, setPendingLikes] = useState(new Set());
      const [localLikedPosts, setLocalLikedPosts] = useState(new Set());
      const [Content, setContent] = useState([]);
      const { posts } = usePostsStore();
      const { Lessons } = useLessonStore();

      useEffect(() => {
        if(isVideo){
          setContent(Lessons);
        }else {
          setContent(posts);
        }
      })

    useEffect(() => {
        const handler = ({ postId, likes, liked }) => {
        setPendingLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
        });
    
        usePostsStore.getState().updatePostLikes(postId, likes);
        
        if (liked) {
            setLocalLikedPosts(prev => new Set([...prev, postId]));
        } else {
            setLocalLikedPosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
            });
        }
        };
    
        Socket.on("post-like-updated", handler);
    
        return () => {
        Socket.off("post-like-updated", handler);
        };
    }, []);

      useEffect(() => {
        if (Content.length > 0 && CurrentUserId) {
          const userLikedPosts = new Set();
          Content.forEach(post => {
            if (VerifyLikeServer(post._id, post?.likes)) {
              userLikedPosts.add(post._id);
            }
          });
          setLocalLikedPosts(userLikedPosts);
        }
      }, [Content, CurrentUserId]);

      const VerifyLikeServer = (postId, likes) => {
          const userId = CurrentUserId;
          if (!userId) return false;
          
          return likes.some(like =>
          typeof like === 'object' ? like._id === userId : like === userId
          );
      };
  
      const VerifyLike = (postId) => {
          return localLikedPosts.has(postId);
      };
  
      const isLikePending = (postId) => {
      return pendingLikes.has(postId);
    };

      const handleLike = async (postId, postAuthorId) => {
        try {
          const UserId = CurrentUserId;
          if (!UserId) return;
          
          const isCurrentlyLiked = localLikedPosts.has(postId);
          
          if (isCurrentlyLiked) {
            setLocalLikedPosts(prev => {
              const newSet = new Set(prev);
              newSet.delete(postId);
              return newSet;
            });
          } else {
            setLocalLikedPosts(prev => new Set([...prev, postId]));
          }
          
          setPendingLikes(prev => new Set([...prev, postId]));
          
          Socket.emit("Handle-user-like", { postId, userId: UserId, type: "like" , toId: postAuthorId  });
          
        } catch (err) {
          console.log(err.message);
          setLocalLikedPosts(new Set(localLikedPosts));
          setPendingLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
      };


  return (
      <button 
        onClick={() => handleLike(PostId, PostAuthorId)}
        disabled={isLikePending(PostId)}
        className="flex items-center space-x-1.5 text-sm transition-all duration-300 hover:scale-105"
    >
            <div className={`p-1.5 rounded-lg transition-colors ${VerifyLike(PostId) ? 'bg-red-500/20 text-red-400' : 'hover:bg-neutral-700/50 text-neutral-400'}`}>
                {isLikePending(PostId) ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ) : VerifyLike(PostId) ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                )}
            </div>
            <span className={`font-medium ${VerifyLike(PostId) ? 'text-red-400' : 'text-neutral-400'}`}>
                {LikeLength || 0}
            </span>
        </button>
  )
}

export default LikeComponent
