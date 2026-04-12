import React, { useState, useRef, useCallback } from 'react';
import type { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ImageIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import Avatar from './Avatar';

interface CreatePostFormProps {
  onAddPost: (post: Post) => void;
}

const MAX_CONTENT_LENGTH = 5000;

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onAddPost }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea for mobile
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CONTENT_LENGTH) {
      setContent(value);
    }
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || !currentUser || isSubmitting) return;

      // Validate content
      const trimmedContent = content.trim();
      if (trimmedContent.length < 1) {
        toast.error('Please write something to share');
        return;
      }

      setIsSubmitting(true);

      try {
        const newPost: Post = {
          id: Date.now(),
          author: {
            id: currentUser.id,
            name: currentUser.name,
            profilePictureUrl: currentUser.profilePictureUrl,
          },
          content: trimmedContent,
          
          timestamp: new Date().toISOString(),
          likes: [],
          comments: [],
        };

        await onAddPost(newPost);
        setContent('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch {
        // Error is handled by parent component
      } finally {
        setIsSubmitting(false);
      }
    },
    [content, currentUser, isSubmitting, onAddPost, toast]
  );

  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isNearLimit = remainingChars < 200;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3 sm:space-x-4">
          <Avatar
            src={currentUser?.profilePictureUrl}
            name={currentUser?.name || 'User'}
            size="md"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              placeholder={`What's on your mind, ${currentUser?.name.split(' ')[0] || 'friend'}?`}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none text-sm sm:text-base min-h-[80px]"
              rows={3}
              maxLength={MAX_CONTENT_LENGTH}
              disabled={isSubmitting}
              aria-label="Write your post"
            />
            {isNearLimit && (
              <p
                className={`text-xs mt-1 text-right ${remainingChars < 50 ? 'text-red-500' : 'text-slate-500'}`}
              >
                {remainingChars} characters remaining
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 ml-0 sm:ml-14 gap-3">
          <div className="flex-1"></div>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="bg-orange-500 text-white font-semibold py-2.5 px-6 sm:px-8 rounded-full hover:bg-orange-600 transition-all disabled:bg-orange-300 disabled:cursor-not-allowed active:scale-95 touch-manipulation text-sm sm:text-base min-w-[80px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Posting...</span>
              </span>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;
