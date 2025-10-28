import React from 'react';
import type { Post } from '../types';
import { UserIcon, ThumbsUpIcon, ChatBubbleIcon } from './icons';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
             {post.author.profilePictureUrl ? (
                <img src={post.author.profilePictureUrl} alt={post.author.name} className="w-full h-full object-cover" />
            ) : (
                <UserIcon className="w-7 h-7 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-lg">{post.author.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{timeSince(post.timestamp)}</p>
          </div>
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-base mb-4 whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.imageUrl && (
        <div className="bg-slate-100 dark:bg-slate-700">
          <img src={post.imageUrl} alt="Post content" className="w-full max-h-[500px] object-cover" />
        </div>
      )}

      <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-around">
        <button className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-orange-600 font-semibold transition-colors rounded-lg px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700">
          <ThumbsUpIcon className="w-5 h-5" />
          <span>Like ({post.likes})</span>
        </button>
        <button className="flex items-center space-x-2 text-gray-600 dark:text-slate-300 hover:text-orange-600 font-semibold transition-colors rounded-lg px-4 py-2 hover:bg-orange-50 dark:hover:bg-slate-700">
          <ChatBubbleIcon className="w-5 h-5" />
          <span>Comment ({post.comments.length})</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;