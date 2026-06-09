import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  subscribeEngagement, 
  subscribeComments, 
  toggleLike, 
  addComment, 
  deleteComment, 
  incrementViews, 
  shareArticle,
  type Comment,
  type EngagementState
} from '../services/blogEngagement';

export const useArticleEngagement = (articleId: string | number) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id?.toString() || null;

  const [state, setState] = useState<EngagementState>({
    likeCount: 0,
    commentCount: 0,
    viewCount: 0
  });
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // Subscribe to likes & views
  useEffect(() => {
    if (!articleId) return;
    
    // Increment view once on mount
    incrementViews(articleId);

    const unsubscribe = subscribeEngagement(articleId, userId, (newState, likedByMe) => {
      setState(newState);
      setIsLiked(likedByMe);
    });

    return () => unsubscribe();
  }, [articleId, userId]);

  // Subscribe to comments
  useEffect(() => {
    if (!articleId) return;
    setLoadingComments(true);
    
    const unsubscribe = subscribeComments(articleId, 20, (newComments) => {
      setComments(newComments);
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [articleId]);

  const handleToggleLike = useCallback(async () => {
    if (!userId) {
      // Could throw or return false so UI can show login modal
      throw new Error('AUTH_REQUIRED');
    }
    
    // Optimistic update
    setIsLiked(!isLiked);
    setState(prev => ({
      ...prev,
      likeCount: isLiked ? Math.max(0, prev.likeCount - 1) : prev.likeCount + 1
    }));

    try {
      await toggleLike(articleId, userId, isLiked);
    } catch (e) {
      // Revert on error
      setIsLiked(isLiked);
      setState(prev => ({
        ...prev,
        likeCount: isLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1)
      }));
      throw e;
    }
  }, [articleId, userId, isLiked]);

  const handleAddComment = useCallback(async (text: string) => {
    if (!userId || !currentUser) {
      throw new Error('AUTH_REQUIRED');
    }
    return addComment(articleId, userId, currentUser.name, text);
  }, [articleId, userId, currentUser]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    return deleteComment(articleId, commentId);
  }, [articleId]);

  const handleShare = useCallback(async (title: string, text: string) => {
    const url = `${window.location.origin}/#/blog/${articleId}`;
    return shareArticle(url, title, text);
  }, [articleId]);

  return {
    ...state,
    isLiked,
    comments,
    loadingComments,
    toggleLike: handleToggleLike,
    addComment: handleAddComment,
    deleteComment: handleDeleteComment,
    shareArticle: handleShare
  };
};
