import React, { useState, useRef } from 'react';
import type { Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, ImageIcon } from './icons';

interface CreatePostFormProps {
  onAddPost: (post: Post) => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onAddPost }) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
        profilePictureUrl: currentUser.profilePictureUrl 
      },
      content,
      imageUrl: image || undefined,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: [],
    };

    onAddPost(newPost);
    setContent('');
    setImage(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentUser?.profilePictureUrl ? (
                <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
                <UserIcon className="w-7 h-7 text-slate-600 dark:text-slate-300" />
            )}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser?.name.split(' ')[0]}?`}
            className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 resize-none"
            rows={3}
          ></textarea>
        </div>
        {image && (
            <div className="mt-4 pl-16 relative">
                <img src={image} alt="Preview" className="max-h-60 w-full rounded-lg object-cover" />
                <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold text-lg hover:bg-black/80">&times;</button>
            </div>
        )}
        <div className="flex justify-between items-center mt-4 pl-16">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 text-orange-600 hover:text-orange-800 dark:hover:text-orange-400 font-semibold">
                <ImageIcon className="w-6 h-6" />
                <span>Add Photo</span>
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
            <button type="submit" disabled={!content.trim()} className="bg-orange-500 text-white font-bold py-2 px-8 rounded-full hover:bg-orange-600 transition-colors disabled:bg-orange-300">
                Post
            </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;