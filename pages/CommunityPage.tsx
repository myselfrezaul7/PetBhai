import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatePostForm from '../components/CreatePostForm';
import PostCard from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_POSTS } from '../constants';
import type { Post } from '../types';
import { GoogleIcon, AppleIcon, FacebookIcon } from '../components/icons';
import { signInWithGoogle, signInWithApple, signInWithFacebook } from '../services/authService';

const POSTS_STORAGE_KEY = 'petbhai_posts';

const getInitialPosts = (): Post[] => {
  try {
    const posts = window.localStorage.getItem(POSTS_STORAGE_KEY);
    if (posts) {
      return JSON.parse(posts);
    } else {
      // If no posts, initialize with mock data
      window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(MOCK_POSTS));
      return MOCK_POSTS;
    }
  } catch (error) {
    console.error("Error reading posts from localStorage", error);
    return MOCK_POSTS;
  }
};

const CommunityPage: React.FC = () => {
  const { isAuthenticated, socialLogin } = useAuth();
  const [posts, setPosts] = useState<Post[]>(getInitialPosts);
  const [isLoading, setIsLoading] = useState<'google' | 'apple' | 'facebook' | null>(null);

  useEffect(() => {
    try {
        window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
        console.error("Error writing posts to localStorage", error);
    }
  }, [posts]);

  const handleAddPost = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
      setIsLoading(provider);
      try {
          let socialUser;
          if (provider === 'google') {
            socialUser = await signInWithGoogle();
          } else if (provider === 'apple') {
            socialUser = await signInWithApple();
          } else {
            socialUser = await signInWithFacebook();
          }
          await socialLogin(socialUser);
          // The user is now logged in, and the component will re-render
      } catch (error) {
          console.error(`${provider} Sign-In failed`, error);
          alert(`Failed to sign in with ${provider}. Please try again.`);
      } finally {
          setIsLoading(null);
      }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Community Hub</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
          Share stories, ask questions, and connect with fellow animal lovers.
        </p>
      </div>

      {isAuthenticated ? (
        <CreatePostForm onAddPost={handleAddPost} />
      ) : (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Join the Conversation!</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">Sign in to share your stories and connect with our community.</p>

          <div className="space-y-4 max-w-sm mx-auto">
              <button onClick={() => handleSocialLogin('google')} disabled={!!isLoading} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  <GoogleIcon className="w-6 h-6" />
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{isLoading === 'google' ? 'Signing in...' : 'Sign in with Google'}</span>
              </button>
              <button onClick={() => handleSocialLogin('apple')} disabled={!!isLoading} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-900 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  <AppleIcon className="w-6 h-6" />
                  <span className="font-semibold">{isLoading === 'apple' ? 'Signing in...' : 'Sign in with Apple'}</span>
              </button>
              <button onClick={() => handleSocialLogin('facebook')} disabled={!!isLoading} className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-[#1877F2] bg-[#1877F2] text-white rounded-lg hover:bg-[#166fe5] transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  <FacebookIcon className="w-6 h-6" />
                  <span className="font-semibold">{isLoading === 'facebook' ? 'Signing in...' : 'Sign in with Facebook'}</span>
              </button>
          </div>
          
          <div className="flex items-center my-6">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
              <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold text-sm">OR</span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
          </div>

          <p className="text-slate-600 dark:text-slate-300">
            <Link to="/login" className="font-semibold text-orange-600 hover:underline">Log in with email</Link> or <Link to="/signup" className="font-semibold text-orange-600 hover:underline">sign up</Link>.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
