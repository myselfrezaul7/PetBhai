import React, { useState, useRef } from 'react';
import type { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, ImageIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface CreatePostFormProps {
  onAddPost: (post: Post) => void;
}

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onAddPost }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setImageError(
          `Oops! Your photo is ${sizeMB}MB. Please choose a smaller image (max ${MAX_IMAGE_SIZE_MB}MB) 📸`
        );
        toast.error(`Photo too large! Max size is ${MAX_IMAGE_SIZE_MB}MB`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !currentUser) return;

    const newPost: Post = {
      id: Date.now(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        profilePictureUrl: currentUser.profilePictureUrl,
      },
      content,
      imageUrl: image || undefined,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    onAddPost(newPost);
    setContent('');
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="glass-card p-6 mb-8">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentUser?.profilePictureUrl ? (
              <img
                src={currentUser.profilePictureUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-7 h-7 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser?.name.split(' ')[0]}?`}
            className="w-full p-3 border border-slate-300/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none"
            rows={3}
          ></textarea>
        </div>
        {image && (
          <div className="mt-4 pl-4 sm:pl-16 relative">
            <img src={image} alt="Preview" className="max-h-60 w-full rounded-lg object-cover" />
            <button
              onClick={() => {
                setImage(null);
                setImageError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold text-lg hover:bg-black/80"
            >
              &times;
            </button>
          </div>
        )}
        {imageError && (
          <div className="mt-3 pl-4 sm:pl-16">
            <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
              ⚠️ {imageError}
            </p>
          </div>
        )}
        <div className="flex justify-between items-center mt-4 pl-4 sm:pl-16">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-orange-600 hover:text-orange-800 dark:hover:text-orange-400 font-semibold"
            >
              <ImageIcon className="w-6 h-6" />
              <span>Add Photo</span>
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
              (max {MAX_IMAGE_SIZE_MB}MB)
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            aria-label="Upload photo for post"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="bg-orange-500 text-white font-bold py-2 px-8 rounded-full hover:bg-orange-600 transition-colors disabled:bg-orange-300"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;
