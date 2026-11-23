import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { safeStorage } from '../lib/storage';
import {
  subscribeEngagement,
  subscribeComments,
  toggleLike,
  addComment,
  deleteComment,
  incrementViews,
  shareArticle,
  getInitialEngagementState,
  getOrCreateGuestId,
  getExistingGuestId,
  type Comment,
  type EngagementState,
} from '../services/blogEngagement';

export interface UseArticleEngagementOptions {
  trackView?: boolean;
}

export const useArticleEngagement = (
  articleId: string | number,
  options?: UseArticleEngagementOptions
) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id?.toString() || null;

  const [state, setState] = useState<EngagementState>(() => getInitialEngagementState(articleId));
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  // Subscribe to likes & views
  useEffect(() => {
    if (articleId === '' || articleId === null || articleId === undefined) return;

    const unsubscribe = subscribeEngagement(articleId, userId, (newState, likedByMe) => {
      setState(newState);
      setIsLiked(likedByMe);
    });

    // Only increment view if trackView is explicitly requested (e.g. on full article detail view).
    // Called right after subscribeEngagement so this hook immediately receives the optimistic +1.
    // StrictMode double-invocations are guarded via runtime Set + sessionStorage in incrementViews.
    if (options?.trackView) {
      void incrementViews(articleId);
    }

    return () => unsubscribe();
  }, [articleId, userId, options?.trackView]);

  // Subscribe to comments
  useEffect(() => {
    if (articleId === '' || articleId === null || articleId === undefined) {
      setComments([]);
      setLoadingComments(false);
      return;
    }
    setLoadingComments(true);

    const unsubscribe = subscribeComments(articleId, 20, (newComments) => {
      setComments(newComments);
      setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [articleId]);

  const handleToggleLike = useCallback(async () => {
    if (!userId) {
      throw new Error('AUTH_REQUIRED');
    }

    // Optimistic update
    setIsLiked(!isLiked);
    setState((prev) => ({
      ...prev,
      likeCount: isLiked ? Math.max(0, prev.likeCount - 1) : prev.likeCount + 1,
    }));

    try {
      await toggleLike(articleId, userId, isLiked);
    } catch (e) {
      // Revert on error
      setIsLiked(isLiked);
      setState((prev) => ({
        ...prev,
        likeCount: isLiked ? prev.likeCount + 1 : Math.max(0, prev.likeCount - 1),
      }));
      throw e;
    }
  }, [articleId, userId, isLiked]);

  const handleAddComment = useCallback(
    async (text: string, guestName?: string): Promise<void> => {
      const trimmedText = typeof text === 'string' ? text.trim() : '';
      if (trimmedText.length < 2) {
        throw new Error('Please write at least 2 characters.');
      }

      let resolvedUserId: string;
      let resolvedUserName: string;

      if (userId && currentUser) {
        resolvedUserId = userId;
        resolvedUserName = currentUser.name || 'PetBhai Member';
      } else {
        const trimmedGuestName = typeof guestName === 'string' ? guestName.trim() : '';
        if (trimmedGuestName) {
          safeStorage.setItem('petbhai_guest_name', trimmedGuestName);
        }
        resolvedUserName =
          trimmedGuestName || safeStorage.getItem('petbhai_guest_name')?.trim() || 'Pet Parent';
        resolvedUserId = getOrCreateGuestId();
      }

      await addComment(articleId, resolvedUserId, resolvedUserName, trimmedText);
    },
    [articleId, userId, currentUser]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      const requesterId = userId || getExistingGuestId() || undefined;
      await deleteComment(articleId, commentId, requesterId);
    },
    [articleId, userId]
  );

  const handleShare = useCallback(
    async (title: string, text: string) => {
      const url = `${window.location.origin}/blog/${articleId}`;
      return shareArticle(url, title, text);
    },
    [articleId]
  );

  return {
    ...state,
    isLiked,
    comments,
    loadingComments,
    toggleLike: handleToggleLike,
    addComment: handleAddComment,
    deleteComment: handleDeleteComment,
    shareArticle: handleShare,
  };
};
