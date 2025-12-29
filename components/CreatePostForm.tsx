import React, { useState, useRef, useCallback } from 'react';
import type { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, ImageIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface CreatePostFormProps {
  onAddPost: (post: Post) => void;
}

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_CONTENT_LENGTH = 5000;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onAddPost }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Compress image if needed
  const compressImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Max dimensions for mobile-friendly images
        const MAX_DIMENSION = 1200;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageError(null);

      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          setImageError('Please select a valid image (JPEG, PNG, GIF, or WebP)');
          toast.error('Invalid image format');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // Check file size
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          // Try to compress if image is too large
          setIsCompressing(true);
          try {
            const compressedDataUrl = await compressImage(file);
            // Check compressed size (rough estimate)
            if (compressedDataUrl.length > MAX_IMAGE_SIZE_BYTES * 1.37) {
              // Base64 overhead
              throw new Error('Still too large');
            }
            setImage(compressedDataUrl);
            toast.success('Image compressed for faster upload! 📸');
          } catch {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            setImageError(
              `Your photo is ${sizeMB}MB. Please choose a smaller image (max ${MAX_IMAGE_SIZE_MB}MB) 📸`
            );
            toast.error(`Photo too large! Max size is ${MAX_IMAGE_SIZE_MB}MB`);
          } finally {
            setIsCompressing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.onerror = () => {
          setImageError('Failed to read image file. Please try again.');
          toast.error('Failed to read image');
        };
        reader.readAsDataURL(file);
      }
    },
    [compressImage, toast]
  );

  const clearImage = useCallback(() => {
    setImage(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          imageUrl: image || undefined,
          timestamp: new Date().toISOString(),
          likes: [],
          comments: [],
        };

        await onAddPost(newPost);
        setContent('');
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        // Error is handled by parent component
      } finally {
        setIsSubmitting(false);
      }
    },
    [content, currentUser, image, isSubmitting, onAddPost, toast]
  );

  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isNearLimit = remainingChars < 200;

  return (
    <div className="glass-card p-4 sm:p-6 mb-6 sm:mb-8">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentUser?.profilePictureUrl ? (
              <img
                src={currentUser.profilePictureUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              placeholder={`What's on your mind, ${currentUser?.name.split(' ')[0] || 'friend'}?`}
              className="w-full p-3 border border-slate-300/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 dark:text-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none text-sm sm:text-base min-h-[80px]"
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

        {image && (
          <div className="mt-4 ml-0 sm:ml-14 relative">
            <img
              src={image}
              alt="Preview"
              className="max-h-48 sm:max-h-60 w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={clearImage}
              disabled={isSubmitting}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg hover:bg-black/80 active:scale-95 transition-all touch-manipulation"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {isCompressing && (
          <div className="mt-3 ml-0 sm:ml-14">
            <p className="text-sm text-orange-500 dark:text-orange-400 flex items-center gap-2">
              <span className="animate-spin">⚙️</span> Compressing image...
            </p>
          </div>
        )}

        {imageError && (
          <div className="mt-3 ml-0 sm:ml-14">
            <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
              ⚠️ {imageError}
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mt-4 ml-0 sm:ml-14 gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || isCompressing}
              className="flex items-center space-x-1.5 sm:space-x-2 text-orange-600 hover:text-orange-800 dark:hover:text-orange-400 font-semibold text-sm sm:text-base disabled:opacity-50 active:scale-95 transition-transform touch-manipulation py-2 px-1"
            >
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden xs:inline">Add Photo</span>
              <span className="xs:hidden">Photo</span>
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
              (max {MAX_IMAGE_SIZE_MB}MB)
            </span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            aria-label="Upload photo for post"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting || isCompressing}
            className="bg-orange-500 text-white font-bold py-2.5 px-6 sm:px-8 rounded-full hover:bg-orange-600 transition-all disabled:bg-orange-300 disabled:cursor-not-allowed active:scale-95 touch-manipulation text-sm sm:text-base min-w-[80px]"
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
