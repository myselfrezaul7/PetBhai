import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatePostForm from '../components/CreatePostForm';
import PostCard from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_POSTS } from '../constants';
import type { Post, Comment, CommentReply } from '../types';
import { GoogleIcon, VideoCameraIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';

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
    console.error('Error reading posts from localStorage', error);
    return MOCK_POSTS;
  }
};

const CommunityPage: React.FC = () => {
  const { isAuthenticated, socialLogin, currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>(getInitialPosts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const { confirm } = useConfirmation();

  useEffect(() => {
    try {
      window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
      console.error('Error writing posts to localStorage', error);
    }
  }, [posts]);

  const handleAddPost = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handleUpdatePost = (postId: number, newContent: string) => {
    setPosts(posts.map((p) => (p.id === postId ? { ...p, content: newContent } : p)));
  };

  const handleDeletePost = async (postId: number) => {
    const shouldDelete = await confirm({
      title: 'Delete Post?',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
    });
    if (shouldDelete) {
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success('Post deleted successfully.');
    }
  };

  const handleAddComment = (postId: number, commentText: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: Date.now(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        profilePictureUrl: currentUser.profilePictureUrl,
      },
      text: commentText,
      replies: [],
    };
    setPosts(
      posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
  };

  const handleAddReply = (postId: number, commentId: number, replyText: string) => {
    if (!currentUser) return;
    const newReply: CommentReply = {
      id: Date.now(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        profilePictureUrl: currentUser.profilePictureUrl,
      },
      text: replyText,
    };
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
              ),
            }
          : p
      )
    );
  };

  const handleSocialLogin = async () => {
    setIsLoading(true);
    try {
      const socialUser = await signInWithGoogle();
      await socialLogin(socialUser);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error(`Google Sign-In failed`, error);
      toast.error(`Failed to sign in with Google: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Community Hub</h1>
        <p className="text-lg text-slate-700 dark:text-slate-200 mt-2">
          Share pet care tips, product reviews, and connect with fellow pet lovers.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Reset community data? This will clear your local posts.')) {
              window.localStorage.removeItem('petbhai_posts');
              window.location.reload();
            }
          }}
          className="mt-2 text-xs text-slate-400 hover:text-red-500 underline"
        >
          Reset Data
        </button>
      </div>

      {/* Creator Tools CTA */}
      <div className="glass-card p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-100 to-orange-50 dark:from-slate-800 dark:to-slate-900 border border-orange-200 dark:border-orange-900/30">
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center justify-center sm:justify-start gap-2">
            <VideoCameraIcon className="w-6 h-6 text-orange-500" />
            Creator Tools
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm">
            Starting a pet vlog? Create custom thumbnails instantly.
          </p>
        </div>
        <Link
          to="/thumbnail-generator"
          className="whitespace-nowrap px-6 py-2.5 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors shadow-md"
        >
          Create Thumbnail
        </Link>
      </div>

      {isAuthenticated ? (
        <CreatePostForm onAddPost={handleAddPost} />
      ) : (
        <div className="glass-card p-8 mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            Join the Conversation!
          </h2>
          <p className="text-slate-700 dark:text-slate-200 mb-6">
            Sign in to share your stories and connect with our community.
          </p>

          <div className="space-y-4 max-w-sm mx-auto">
            <button
              onClick={handleSocialLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 py-3 px-4 border border-slate-300 dark:border-slate-500 rounded-lg hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <GoogleIcon className="w-6 h-6" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </span>
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            <span className="flex-shrink mx-4 text-slate-500 dark:text-slate-400 font-semibold text-sm">
              OR
            </span>
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          </div>

          <p className="text-slate-600 dark:text-slate-300">
            <Link to="/login" className="font-semibold text-orange-600 hover:underline">
              Log in with email
            </Link>{' '}
            or{' '}
            <Link to="/signup" className="font-semibold text-orange-600 hover:underline">
              sign up
            </Link>
            .
          </p>
        </div>
      )}

      <div className="space-y-8">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
          />
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
