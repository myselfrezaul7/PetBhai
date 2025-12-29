import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Post } from '../types';
import { UserIcon, ThumbsUpIcon, ChatBubbleIcon, SendIcon, CloseIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { sanitizeInput, validateContentLength } from '../lib/security';

// Constants for validation
const MAX_CONTENT_LENGTH = 5000;
const MAX_COMMENT_LENGTH = 1000;
const MAX_REPLY_LENGTH = 500;

interface PostCardProps {
  post: Post;
  onUpdatePost: (postId: number, newContent: string) => Promise<void> | void;
  onDeletePost: (postId: number) => Promise<void> | void;
  onLikePost: (postId: number) => Promise<void> | void;
  onLikeComment: (postId: number, commentId: number) => Promise<void> | void;
  onLikeReply: (postId: number, commentId: number, replyId: number) => Promise<void> | void;
  onAddComment: (postId: number, commentText: string) => Promise<void> | void;
  onAddReply: (postId: number, commentId: number, replyText: string) => Promise<void> | void;
  onUpdateComment: (postId: number, commentId: number, newText: string) => Promise<void> | void;
  onUpdateReply: (
    postId: number,
    commentId: number,
    replyId: number,
    newText: string
  ) => Promise<void> | void;
  onDeleteComment: (postId: number, commentId: number) => Promise<void> | void;
  onDeleteReply: (postId: number, commentId: number, replyId: number) => Promise<void> | void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onUpdatePost,
  onDeletePost,
  onLikePost,
  onLikeComment,
  onLikeReply,
  onAddComment,
  onAddReply,
  onUpdateComment,
  onUpdateReply,
  onDeleteComment,
  onDeleteReply,
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirmation();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<{
    commentId: number;
    replyId: number;
  } | null>(null);
  const [editedCommentText, setEditedCommentText] = useState('');
  const [editedReplyText, setEditedReplyText] = useState('');

  // Loading states for async operations
  const [isLiking, setIsLiking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingCommentId, setLoadingCommentId] = useState<number | null>(null);
  const [loadingReplyId, setLoadingReplyId] = useState<string | null>(null);

  // Refs
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
      editTextareaRef.current.focus();
    }
  }, [isEditing, editedContent]);

  const timeSince = useCallback((date: string) => {
    try {
      const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
      if (isNaN(seconds) || seconds < 0) return 'now';

      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + 'y';
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + 'mo';
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + 'd';
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + 'h';
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + 'm';
      return seconds < 5 ? 'now' : Math.floor(seconds) + 's';
    } catch {
      return 'now';
    }
  }, []);

  const handleUpdate = useCallback(async () => {
    const sanitized = sanitizeInput(editedContent);
    if (!validateContentLength(sanitized, MAX_CONTENT_LENGTH)) {
      toast.error(`Post must be ${MAX_CONTENT_LENGTH} characters or less`);
      return;
    }
    if (!sanitized.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdatePost(post.id, sanitized);
      setIsEditing(false);
      toast.success('Post updated! ✓');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  }, [editedContent, onUpdatePost, post.id, toast]);

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Delete Post',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDeletePost(post.id);
      toast.success('Post deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  }, [confirm, onDeletePost, post.id, toast]);

  const handleLikePost = useCallback(async () => {
    if (isLiking || !currentUser) return;

    setIsLiking(true);
    try {
      await onLikePost(post.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to like post');
    } finally {
      setIsLiking(false);
    }
  }, [isLiking, currentUser, onLikePost, post.id, toast]);

  const handleCommentSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const sanitized = sanitizeInput(commentText);
      if (!validateContentLength(sanitized, MAX_COMMENT_LENGTH)) {
        toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
        return;
      }
      if (!sanitized.trim()) return;

      setIsSubmitting(true);
      try {
        await onAddComment(post.id, sanitized);
        setCommentText('');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to add comment');
      } finally {
        setIsSubmitting(false);
      }
    },
    [commentText, onAddComment, post.id, toast]
  );

  const handleReplySubmit = useCallback(
    async (e: React.FormEvent, commentId: number) => {
      e.preventDefault();

      const sanitized = sanitizeInput(replyText);
      if (!validateContentLength(sanitized, MAX_REPLY_LENGTH)) {
        toast.error(`Reply must be ${MAX_REPLY_LENGTH} characters or less`);
        return;
      }
      if (!sanitized.trim()) return;

      setLoadingReplyId(`submit-${commentId}`);
      try {
        await onAddReply(post.id, commentId, sanitized);
        setReplyText('');
        setReplyingTo(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to add reply');
      } finally {
        setLoadingReplyId(null);
      }
    },
    [replyText, onAddReply, post.id, toast]
  );

  const handleEditComment = useCallback((commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditedCommentText(currentText);
    setEditingReplyId(null);
  }, []);

  const handleSaveComment = useCallback(
    async (commentId: number) => {
      const sanitized = sanitizeInput(editedCommentText);
      if (!validateContentLength(sanitized, MAX_COMMENT_LENGTH)) {
        toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
        return;
      }
      if (!sanitized.trim()) return;

      setLoadingCommentId(commentId);
      try {
        await onUpdateComment(post.id, commentId, sanitized);
        setEditingCommentId(null);
        setEditedCommentText('');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update comment');
      } finally {
        setLoadingCommentId(null);
      }
    },
    [editedCommentText, onUpdateComment, post.id, toast]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      const confirmed = await confirm({
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });

      if (!confirmed) return;

      setLoadingCommentId(commentId);
      try {
        await onDeleteComment(post.id, commentId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete comment');
      } finally {
        setLoadingCommentId(null);
      }
    },
    [confirm, onDeleteComment, post.id, toast]
  );

  const handleCancelEditComment = useCallback(() => {
    setEditingCommentId(null);
    setEditedCommentText('');
  }, []);

  const handleEditReply = useCallback((commentId: number, replyId: number, currentText: string) => {
    setEditingReplyId({ commentId, replyId });
    setEditedReplyText(currentText);
    setEditingCommentId(null);
  }, []);

  const handleSaveReply = useCallback(
    async (commentId: number, replyId: number) => {
      const sanitized = sanitizeInput(editedReplyText);
      if (!validateContentLength(sanitized, MAX_REPLY_LENGTH)) {
        toast.error(`Reply must be ${MAX_REPLY_LENGTH} characters or less`);
        return;
      }
      if (!sanitized.trim()) return;

      setLoadingReplyId(`${commentId}-${replyId}`);
      try {
        await onUpdateReply(post.id, commentId, replyId, sanitized);
        setEditingReplyId(null);
        setEditedReplyText('');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update reply');
      } finally {
        setLoadingReplyId(null);
      }
    },
    [editedReplyText, onUpdateReply, post.id, toast]
  );

  const handleDeleteReply = useCallback(
    async (commentId: number, replyId: number) => {
      const confirmed = await confirm({
        title: 'Delete Reply',
        message: 'Are you sure you want to delete this reply?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });

      if (!confirmed) return;

      setLoadingReplyId(`${commentId}-${replyId}`);
      try {
        await onDeleteReply(post.id, commentId, replyId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to delete reply');
      } finally {
        setLoadingReplyId(null);
      }
    },
    [confirm, onDeleteReply, post.id, toast]
  );

  const handleCancelEditReply = useCallback(() => {
    setEditingReplyId(null);
    setEditedReplyText('');
  }, []);

  const handleLikeComment = useCallback(
    async (commentId: number) => {
      if (loadingCommentId === commentId) return;

      try {
        await onLikeComment(post.id, commentId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to like comment');
      }
    },
    [loadingCommentId, onLikeComment, post.id, toast]
  );

  const handleLikeReply = useCallback(
    async (commentId: number, replyId: number) => {
      const key = `${commentId}-${replyId}`;
      if (loadingReplyId === key) return;

      try {
        await onLikeReply(post.id, commentId, replyId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to like reply');
      }
    },
    [loadingReplyId, onLikeReply, post.id, toast]
  );

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this post on PetBhai: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PetBhai Community Post',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled sharing or not supported
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast.success('Link copied to clipboard! 📋');
      } catch {
        toast.error('Failed to copy link');
      }
    }
  }, [post.content, toast]);

  // Keyboard handlers for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const isAuthor = currentUser?.id === post.author.id;
  const hasLikedPost = currentUser ? post.likes.includes(currentUser.id) : false;
  const isDisabled = isSubmitting || isDeleting;

  return (
    <>
      <div
        className={`glass-card overflow-hidden transition-all duration-300 hover:shadow-xl ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md">
                {post.author.profilePictureUrl ? (
                  <img
                    src={post.author.profilePictureUrl}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 sm:w-7 sm:h-7 text-slate-600 dark:text-slate-300" />
                )}
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm sm:text-lg hover:text-orange-500 cursor-pointer transition-colors">
                  {post.author.name}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {timeSince(post.timestamp)} ago
                </p>
              </div>
            </div>
            {isAuthor && !isEditing && (
              <div className="flex space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <button
                  onClick={() => {
                    setEditedContent(post.content);
                    setIsEditing(true);
                  }}
                  disabled={isDisabled}
                  className="font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 touch-manipulation disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDisabled}
                  className="font-semibold text-red-500 hover:text-red-600 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 touch-manipulation disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
          {isEditing ? (
            <div>
              <textarea
                ref={editTextareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                maxLength={MAX_CONTENT_LENGTH}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none min-h-[100px] touch-manipulation"
                rows={3}
                aria-label="Edit post content"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-xs ${editedContent.length > MAX_CONTENT_LENGTH * 0.9 ? 'text-orange-500' : 'text-slate-400'}`}
                >
                  {editedContent.length}/{MAX_CONTENT_LENGTH}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(post.content);
                    }}
                    disabled={isSubmitting}
                    className="text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-95 touch-manipulation disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isSubmitting || !editedContent.trim()}
                    className="text-sm font-bold text-white bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors active:scale-95 touch-manipulation disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base mb-3 sm:mb-4 whitespace-pre-wrap leading-relaxed break-words">
              {post.content}
            </p>
          )}
        </div>

        {post.imageUrl && (
          <div
            className="bg-black/5 dark:bg-black/20 cursor-pointer relative group"
            onClick={() => setShowImageModal(true)}
            onKeyDown={(e) => handleKeyDown(e, () => setShowImageModal(true))}
            role="button"
            tabIndex={0}
            aria-label="View full image"
          >
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full max-h-[400px] sm:max-h-[500px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium transition-opacity">
                Click to expand
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-y border-white/20 dark:border-slate-700/50 flex justify-around">
          <button
            onClick={handleLikePost}
            disabled={isLiking || !currentUser}
            aria-label={hasLikedPost ? 'Unlike post' : 'Like post'}
            aria-pressed={hasLikedPost}
            className={`flex items-center space-x-1 sm:space-x-2 font-semibold transition-all rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-base active:scale-95 touch-manipulation disabled:opacity-50 ${
              hasLikedPost
                ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <ThumbsUpIcon
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${hasLikedPost ? 'scale-110' : ''} ${isLiking ? 'animate-pulse' : ''}`}
            />
            <span className="hidden xs:inline">
              {post.likes.length > 0 ? post.likes.length : ''} Like
              {post.likes.length !== 1 ? 's' : ''}
            </span>
            <span className="xs:hidden">{post.likes.length > 0 ? post.likes.length : '0'}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            aria-expanded={showComments}
            aria-label={`${showComments ? 'Hide' : 'Show'} comments`}
            className={`flex items-center space-x-1 sm:space-x-2 font-semibold transition-colors rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-base active:scale-95 touch-manipulation ${
              showComments
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <ChatBubbleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xs:inline">
              {post.comments.length > 0 ? post.comments.length : ''} Comment
              {post.comments.length !== 1 ? 's' : ''}
            </span>
            <span className="xs:hidden">
              {post.comments.length > 0 ? post.comments.length : '0'}
            </span>
          </button>
          <button
            onClick={handleShare}
            aria-label="Share post"
            className="flex items-center space-x-1 sm:space-x-2 text-slate-600 dark:text-slate-300 hover:text-green-600 font-semibold transition-colors rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-base hover:bg-green-50/50 dark:hover:bg-slate-700/50 active:scale-95 touch-manipulation"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="hidden xs:inline">Share</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/50">
            {/* Comment Input */}
            {currentUser ? (
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                    {currentUser.profilePictureUrl ? (
                      <img
                        src={currentUser.profilePictureUrl}
                        alt="You"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      maxLength={MAX_COMMENT_LENGTH}
                      disabled={isSubmitting}
                      className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent touch-manipulation disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmitting}
                      className="self-end sm:self-auto bg-orange-500 text-white rounded-full px-4 py-2 sm:p-3 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sm:gap-0 active:scale-95 touch-manipulation min-h-[40px] sm:min-h-0"
                    >
                      {isSubmitting ? (
                        <svg
                          className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      <span className="sm:hidden text-sm font-medium">
                        {isSubmitting ? 'Sending...' : 'Send'}
                      </span>
                    </button>
                  </div>
                </div>
                {commentText.length > MAX_COMMENT_LENGTH * 0.8 && (
                  <p
                    className={`text-xs mt-1 ml-12 ${commentText.length >= MAX_COMMENT_LENGTH ? 'text-red-500' : 'text-orange-500'}`}
                  >
                    {commentText.length}/{MAX_COMMENT_LENGTH}
                  </p>
                )}
              </form>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400 mb-4 py-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                Please sign in to comment
              </p>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                  No comments yet. Be the first to comment! 💬
                </p>
              ) : (
                post.comments.map((comment) => {
                  const hasLikedComment = currentUser
                    ? comment.likes.includes(currentUser.id)
                    : false;
                  const isCommentAuthor = currentUser?.id === comment.author.id;

                  return (
                    <div key={comment.id} className="animate-fade-in">
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                          {comment.author.profilePictureUrl ? (
                            <img
                              src={comment.author.profilePictureUrl}
                              alt={comment.author.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl shadow-sm">
                            <p className="font-bold text-slate-800 dark:text-white text-sm">
                              {comment.author.name}
                            </p>
                            {editingCommentId === comment.id ? (
                              <div className="mt-2">
                                <textarea
                                  value={editedCommentText}
                                  onChange={(e) => setEditedCommentText(e.target.value)}
                                  className="w-full p-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                                  rows={2}
                                  autoFocus
                                  aria-label="Edit comment"
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleSaveComment(comment.id)}
                                    className="px-3 py-1 text-xs font-medium bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditComment}
                                    className="px-3 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-700 dark:text-slate-300 mt-1 break-words">
                                {comment.text}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-1.5 ml-2">
                            <button
                              onClick={() => handleLikeComment(comment.id)}
                              disabled={loadingCommentId === comment.id}
                              aria-label={hasLikedComment ? 'Unlike comment' : 'Like comment'}
                              className={`text-xs font-semibold transition-colors py-1 px-1.5 rounded active:scale-95 touch-manipulation disabled:opacity-50 ${
                                hasLikedComment
                                  ? 'text-orange-500'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-orange-500'
                              }`}
                            >
                              {hasLikedComment ? '❤️' : '🤍'}{' '}
                              {comment.likes.length > 0 && comment.likes.length}
                            </button>
                            <button
                              onClick={() =>
                                setReplyingTo(replyingTo === comment.id ? null : comment.id)
                              }
                              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors py-1 px-1.5 rounded active:scale-95 touch-manipulation"
                            >
                              Reply
                            </button>
                            <span className="text-xs text-slate-400">
                              {comment.timestamp ? timeSince(comment.timestamp) : ''}
                            </span>
                            {isCommentAuthor && editingCommentId !== comment.id && (
                              <>
                                <button
                                  onClick={() => handleEditComment(comment.id, comment.text)}
                                  disabled={loadingCommentId === comment.id}
                                  className="text-xs font-semibold text-blue-400 hover:text-blue-500 transition-colors py-1 px-1.5 rounded active:scale-95 touch-manipulation disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={loadingCommentId === comment.id}
                                  className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors py-1 px-1.5 rounded active:scale-95 touch-manipulation disabled:opacity-50"
                                >
                                  {loadingCommentId === comment.id ? '...' : 'Delete'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies.length > 0 && (
                        <div className="ml-12 mt-3 space-y-3">
                          {comment.replies.map((reply) => {
                            const hasLikedReply = currentUser
                              ? reply.likes.includes(currentUser.id)
                              : false;
                            const isReplyAuthor = currentUser?.id === reply.author.id;

                            return (
                              <div
                                key={reply.id}
                                className="flex items-start space-x-3 animate-fade-in"
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                                  {reply.author.profilePictureUrl ? (
                                    <img
                                      src={reply.author.profilePictureUrl}
                                      alt={reply.author.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <UserIcon className="w-4 h-4 text-slate-500" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-slate-100 dark:bg-slate-600 p-2 rounded-xl">
                                    <p className="font-bold text-slate-800 dark:text-white text-xs">
                                      {reply.author.name}
                                    </p>
                                    {editingReplyId?.commentId === comment.id &&
                                    editingReplyId?.replyId === reply.id ? (
                                      <div className="mt-1">
                                        <textarea
                                          value={editedReplyText}
                                          onChange={(e) => setEditedReplyText(e.target.value)}
                                          className="w-full p-2 text-xs border border-slate-200 dark:border-slate-500 bg-white dark:bg-slate-500 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                                          rows={2}
                                          autoFocus
                                          aria-label="Edit reply"
                                        />
                                        <div className="flex gap-2 mt-1.5">
                                          <button
                                            onClick={() => handleSaveReply(comment.id, reply.id)}
                                            className="px-2 py-1 text-xs font-medium bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={handleCancelEditReply}
                                            className="px-2 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-400 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-slate-700 dark:text-slate-300 text-sm break-words">
                                        {reply.text}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-1 ml-2">
                                    <button
                                      onClick={() => handleLikeReply(comment.id, reply.id)}
                                      disabled={loadingReplyId === `${comment.id}-${reply.id}`}
                                      aria-label={hasLikedReply ? 'Unlike reply' : 'Like reply'}
                                      className={`text-xs font-semibold transition-colors py-1 px-1.5 rounded active:scale-95 touch-manipulation disabled:opacity-50 ${
                                        hasLikedReply
                                          ? 'text-orange-500'
                                          : 'text-slate-400 hover:text-orange-500'
                                      }`}
                                    >
                                      {hasLikedReply ? '❤️' : '🤍'}{' '}
                                      {reply.likes.length > 0 && reply.likes.length}
                                    </button>
                                    <span className="text-xs text-slate-400">
                                      {reply.timestamp ? timeSince(reply.timestamp) : ''}
                                    </span>
                                    {isReplyAuthor &&
                                      !(
                                        editingReplyId?.commentId === comment.id &&
                                        editingReplyId?.replyId === reply.id
                                      ) && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleEditReply(comment.id, reply.id, reply.text)
                                            }
                                            disabled={
                                              loadingReplyId === `${comment.id}-${reply.id}`
                                            }
                                            className="text-xs font-semibold text-blue-400 hover:text-blue-500 transition-colors py-1 px-1.5 rounded active:scale-95 touch-manipulation disabled:opacity-50"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteReply(comment.id, reply.id)}
                                            disabled={
                                              loadingReplyId === `${comment.id}-${reply.id}`
                                            }
                                            className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors py-1 px-1.5 rounded active:scale-95 touch-manipulation disabled:opacity-50"
                                          >
                                            {loadingReplyId === `${comment.id}-${reply.id}`
                                              ? '...'
                                              : 'Delete'}
                                          </button>
                                        </>
                                      )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply Form */}
                      {replyingTo === comment.id && currentUser && (
                        <form
                          onSubmit={(e) => handleReplySubmit(e, comment.id)}
                          className="ml-8 sm:ml-12 mt-3"
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                              {currentUser.profilePictureUrl ? (
                                <img
                                  src={currentUser.profilePictureUrl}
                                  alt="You"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${comment.author.name}...`}
                                maxLength={MAX_REPLY_LENGTH}
                                disabled={loadingReplyId === `submit-${comment.id}`}
                                className="w-full p-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-full focus:ring-2 focus:ring-orange-500 touch-manipulation disabled:opacity-50"
                                autoFocus
                              />
                              <button
                                type="submit"
                                disabled={
                                  !replyText.trim() || loadingReplyId === `submit-${comment.id}`
                                }
                                className="self-end sm:self-auto bg-orange-500 text-white rounded-full px-3 py-1.5 sm:p-2 hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 sm:gap-0 active:scale-95 touch-manipulation min-h-[36px] sm:min-h-0"
                              >
                                {loadingReplyId === `submit-${comment.id}` ? (
                                  <svg
                                    className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
                                  <SendIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                )}
                                <span className="sm:hidden text-xs font-medium">
                                  {loadingReplyId === `submit-${comment.id}`
                                    ? 'Sending...'
                                    : 'Reply'}
                                </span>
                              </button>
                            </div>
                          </div>
                          {replyText.length > MAX_REPLY_LENGTH * 0.7 && (
                            <p
                              className={`text-xs mt-1 ml-10 ${replyText.length >= MAX_REPLY_LENGTH ? 'text-red-500' : 'text-orange-500'}`}
                            >
                              {replyText.length}/{MAX_REPLY_LENGTH}
                            </p>
                          )}
                        </form>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && post.imageUrl && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowImageModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full size image"
        >
          <button
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white hover:text-orange-400 transition-colors p-2 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 touch-manipulation z-10"
            onClick={() => setShowImageModal(false)}
            aria-label="Close image modal"
          >
            <CloseIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <img
            src={post.imageUrl}
            alt="Post content - full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </>
  );
};

export default React.memo(PostCard);
