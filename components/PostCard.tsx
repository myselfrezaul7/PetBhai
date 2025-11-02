import React, { useState } from 'react';
import type { Post, Comment, CommentReply } from '../types';
import { UserIcon, ThumbsUpIcon, ChatBubbleIcon, SendIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';

interface PostCardProps {
  post: Post;
  onUpdatePost: (postId: number, newContent: string) => void;
  onDeletePost: (postId: number) => void;
  onAddComment: (postId: number, commentText: string) => void;
  onAddReply: (postId: number, commentId: number, replyText: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdatePost, onDeletePost, onAddComment, onAddReply }) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  }

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
  }

  const isAuthor = currentUser?.id === post.author.id;

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {post.author.profilePictureUrl ? (
                  <img src={post.author.profilePictureUrl} alt={post.author.name} className="w-full h-full object-cover" />
              ) : (
                  <UserIcon className="w-7 h-7 text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-lg">{post.author.name}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{timeSince(post.timestamp)}</p>
            </div>
          </div>
          {isAuthor && (
            <div className="flex space-x-2 text-sm">
                <button onClick={() => setIsEditing(true)} className="font-semibold text-slate-600 dark:text-slate-300 hover:underline">Edit</button>
                <button onClick={() => onDeletePost(post.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
            </div>
          )}
        </div>
        {isEditing ? (
            <div>
                <textarea 
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50"
                    rows={3}
                />
                <div className="flex justify-end space-x-2 mt-2">
                    <button onClick={() => setIsEditing(false)} className="text-sm font-semibold">Cancel</button>
                    <button onClick={handleUpdate} className="text-sm font-bold text-white bg-orange-500 px-3 py-1 rounded-md">Save</button>
                </div>
            </div>
        ) : (
            <p className="text-slate-700 dark:text-slate-300 text-base mb-4 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {post.imageUrl && (
        <div className="bg-black/10 dark:bg-black/20">
          <img src={post.imageUrl} alt="Post content" className="w-full max-h-[500px] object-cover" loading="lazy" />
        </div>
      )}

      <div className="px-6 py-3 border-y border-white/20 dark:border-slate-700/50 flex justify-around">
        <button className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-orange-600 font-semibold transition-colors rounded-lg px-4 py-2 hover:bg-orange-50/50 dark:hover:bg-slate-700/50">
          <ThumbsUpIcon className="w-5 h-5" />
          <span>Like ({post.likes})</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-orange-600 font-semibold transition-colors rounded-lg px-4 py-2 hover:bg-orange-50/50 dark:hover:bg-slate-700/50">
          <ChatBubbleIcon className="w-5 h-5" />
          <span>Comment ({post.comments.length})</span>
        </button>
      </div>

      {showComments && (
        <div className="p-6 bg-black/5 dark:bg-black/10">
          {currentUser && (
            <form onSubmit={handleCommentSubmit} className="flex items-center space-x-3 mb-6">
                <img src={currentUser.profilePictureUrl} alt="You" className="w-9 h-9 rounded-full object-cover" />
                <input 
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-2 border border-slate-300/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 rounded-full focus:ring-2 focus:ring-orange-500"
                />
                <button type="submit" className="bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600"><SendIcon className="w-5 h-5" /></button>
            </form>
          )}
          <div className="space-y-4">
            {post.comments.map(comment => (
                <div key={comment.id}>
                    <div className="flex items-start space-x-3">
                        <img src={comment.author.profilePictureUrl} alt={comment.author.name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                            <div className="bg-slate-100/70 dark:bg-slate-700/70 p-3 rounded-xl">
                                <p className="font-bold text-slate-800 dark:text-white text-sm">{comment.author.name}</p>
                                <p className="text-slate-700 dark:text-slate-300">{comment.text}</p>
                            </div>
                            <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 hover:underline">Reply</button>
                        </div>
                    </div>
                    {/* Replies */}
                    {comment.replies.map(reply => (
                         <div key={reply.id} className="flex items-start space-x-3 ml-12 mt-3">
                            <img src={reply.author.profilePictureUrl} alt={reply.author.name} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                                <div className="bg-slate-100/70 dark:bg-slate-700/70 p-2 rounded-xl">
                                    <p className="font-bold text-slate-800 dark:text-white text-xs">{reply.author.name}</p>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm">{reply.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Reply Form */}
                    {replyingTo === comment.id && currentUser && (
                         <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex items-center space-x-3 ml-12 mt-3">
                            <img src={currentUser.profilePictureUrl} alt="You" className="w-8 h-8 rounded-full object-cover" />
                            <input 
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${comment.author.name}...`}
                                className="w-full p-2 border border-slate-300/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 rounded-full focus:ring-2 focus:ring-orange-500"
                                autoFocus
                            />
                        </form>
                    )}
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(PostCard);