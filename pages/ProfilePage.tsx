import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon } from '../components/icons';

const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(currentUser?.profilePictureUrl || null);
  const [newProfilePictureFile, setNewProfilePictureFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If user is not authenticated, redirect to login page
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let updatedData: { name?: string; profilePictureUrl?: string } = {};

      if (name !== currentUser.name) {
        updatedData.name = name;
      }
      
      // Since we are not using a backend, we'll just use the base64 data URL
      // In a real app, you would upload the file and get back a URL
      if (newProfilePictureFile && profilePicture) {
        updatedData.profilePictureUrl = profilePicture;
      }

      if (Object.keys(updatedData).length > 0) {
        await updateProfile(updatedData);
        setSuccessMessage('Profile updated successfully!');
      } else {
        setSuccessMessage('No changes to save.');
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    // This will be briefly visible before the useEffect redirect kicks in
    return null;
  }

  return (
    <div className="container mx-auto px-6 py-12 flex-grow flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-8">Edit Your Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden ring-4 ring-orange-200 dark:ring-orange-500/30">
                {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-20 h-20 text-slate-600 dark:text-slate-300" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600 shadow-md"
                aria-label="Change profile picture"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Click the pencil to change your photo.</p>
          </div>

          <div>
            <label htmlFor="name" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Full Name</label>
            <input 
              type="text" 
              id="name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-slate-700 dark:text-slate-200"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2">Email Address</label>
            <input 
              type="email" 
              id="email" 
              value={currentUser.email}
              disabled
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-lg text-center">{successMessage}</p>}
          {errorMessage && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{errorMessage}</p>}

          <div>
            <button type="submit" disabled={isLoading} className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg text-lg hover:bg-orange-600 transition-colors disabled:bg-orange-300">
              {isLoading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
