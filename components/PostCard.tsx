import React, { useState } from 'react';
import type { Post } from '../types';
import { UserIcon, ThumbsUpIcon, ChatBubbleIcon, SendIcon, CloseIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface PostCardProps {
  post: Post;
  onUpdatePost: (postId: number, newContent: string) => void;
  onDeletePost: (postId: number) => void;
  onLikePost: (postId: number) => void;
  onLikeComment: (postId: number, commentId: number) => void;
  onLikeReply: (postId: number, commentId: number, replyId: number) => void;
  onAddComment: (postId: number, commentText: string) => void;
  onAddReply: (postId: number, commentId: number, replyText: string) => void;
  onDeleteComment: (postId: number, commentId: number) => void;
  onDeleteReply: (postId: number, commentId: number, replyId: number) => void;
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
  onDeleteComment,
  onDeleteReply,
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
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
    return Math.floor(seconds) + 's';
  };

  const handleUpdate = () => {
    onUpdatePost(post.id, editedContent);
    setIsEditing(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const handleReplySubmit = (e: React.FormEvent, commentId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(post.id, commentId, replyText);
    setReplyText('');
    setReplyingTo(null);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this post on PetBhai: "${post.content.substring(0, 100)}..."`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PetBhai Community Post',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success('Link copied to clipboard! 📋');
    }
  };

  const isAuthor = currentUser?.id === post.author.id;
  const hasLikedPost = currentUser ? post.likes.includes(currentUser.id) : false;

  return (
    <>
      <div className="glass-card overflow-hidden transition-all duration-300 hover:shadow-xl">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-md">
                {post.author.profilePictureUrl ? (
                  <img
                    src={post.author.profilePictureUrl}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
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
            {isAuthor && (
              <div className="flex space-x-1 sm:space-x-2 text-xs sm:text-sm">
                <button
                  onClick={() => setIsEditing(true)}
                  className="font-semibold text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors px-1.5 sm:px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeletePost(post.id)}
                  className="font-semibold text-red-500 hover:text-red-600 transition-colors px-1.5 sm:px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          {isEditing ? (
            <div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="text-sm font-bold text-white bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-700 dark:text-slate-300 text-sm sm:text-base mb-3 sm:mb-4 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          )}
        </div>

        {post.imageUrl && (
          <div
            className="bg-black/5 dark:bg-black/20 cursor-pointer relative group"
            onClick={() => setShowImageModal(true)}
          >
            <img
              src={post.imageUrl}
              alt="Post content"
              className="w-full max-h-[500px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
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
            onClick={() => onLikePost(post.id)}
            className={`flex items-center space-x-1 sm:space-x-2 font-semibold transition-all rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base ${
              hasLikedPost
                ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 hover:bg-orange-50/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <ThumbsUpIcon
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${hasLikedPost ? 'scale-110' : ''}`}
            />
            <span className="hidden xs:inline">
              {post.likes.length > 0 ? post.likes.length : ''} Like
              {post.likes.length !== 1 ? 's' : ''}
            </span>
            <span className="xs:hidden">{post.likes.length > 0 ? post.likes.length : '0'}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-1 sm:space-x-2 font-semibold transition-colors rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base ${
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
            className="flex items-center space-x-1 sm:space-x-2 text-slate-600 dark:text-slate-300 hover:text-green-600 font-semibold transition-colors rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base hover:bg-green-50/50 dark:hover:bg-slate-700/50"
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
          <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
            {/* Comment Input */}
            {currentUser ? (
              <form onSubmit={handleCommentSubmit} className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                  {currentUser.profilePictureUrl ? (
                    <img
                      src={currentUser.profilePictureUrl}
                      alt="You"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-slate-500" />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-orange-500 text-white rounded-full p-3 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
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
                        <div className="flex-1">
                          <div className="bg-white dark:bg-slate-700 p-3 rounded-2xl shadow-sm">
                            <p className="font-bold text-slate-800 dark:text-white text-sm">
                              {comment.author.name}
                            </p>
                            <p className="text-slate-700 dark:text-slate-300 mt-1">
                              {comment.text}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 ml-2">
                            <button
                              onClick={() => onLikeComment(post.id, comment.id)}
                              className={`text-xs font-semibold transition-colors ${
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
                              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
                            >
                              Reply
                            </button>
                            <span className="text-xs text-slate-400">
                              {comment.timestamp ? timeSince(comment.timestamp) : ''}
                            </span>
                            {isCommentAuthor && (
                              <button
                                onClick={() => onDeleteComment(post.id, comment.id)}
                                className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors"
                              >
                                Delete
                              </button>
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
                                <div className="flex-1">
                                  <div className="bg-slate-100 dark:bg-slate-600 p-2 rounded-xl">
                                    <p className="font-bold text-slate-800 dark:text-white text-xs">
                                      {reply.author.name}
                                    </p>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                                      {reply.text}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-4 mt-1 ml-2">
                                    <button
                                      onClick={() => onLikeReply(post.id, comment.id, reply.id)}
                                      className={`text-xs font-semibold transition-colors ${
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
                                    {isReplyAuthor && (
                                      <button
                                        onClick={() => onDeleteReply(post.id, comment.id, reply.id)}
                                        className="text-xs font-semibold text-red-400 hover:text-red-500 transition-colors"
                                      >
                                        Delete
                                      </button>
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
                          className="flex items-center space-x-3 ml-12 mt-3"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                            {currentUser.profilePictureUrl ? (
                              <img
                                src={currentUser.profilePictureUrl}
                                alt="You"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-slate-500" />
                              </div>
                            )}
                          </div>
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.author.name}...`}
                            className="flex-1 p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-full text-sm focus:ring-2 focus:ring-orange-500"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={!replyText.trim()}
                            className="bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
                          >
                            <SendIcon className="w-4 h-4" />
                          </button>
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
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-orange-400 transition-colors"
            onClick={() => setShowImageModal(false)}
          >
            <CloseIcon className="w-8 h-8" />
          </button>
          <img
            src={post.imageUrl}
            alt="Post content"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default React.memo(PostCard);
