import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatePostForm from '../components/CreatePostForm';
import PostCard from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_POSTS } from '../constants';
import type { Post, Comment, CommentReply } from '../types';
import { GoogleIcon, UserGroupIcon, HeartIcon, ChatBubbleIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';

const POSTS_STORAGE_KEY = 'petbhai_posts';

const getInitialPosts = (): Post[] => {
  try {
    const posts = window.localStorage.getItem(POSTS_STORAGE_KEY);
    if (posts) {
      const parsed = JSON.parse(posts);
      // Validate basic structure
      if (
        Array.isArray(parsed) &&
        parsed.every((p) => p && typeof p === 'object' && typeof p.id === 'number')
      ) {
        return parsed;
      }
      // Clear invalid data
      console.warn('Invalid posts data in localStorage, resetting to mock posts');
      window.localStorage.removeItem(POSTS_STORAGE_KEY);
    }
    // Initialize with mock data if empty or invalid
    window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(MOCK_POSTS));
    return MOCK_POSTS;
  } catch (error) {
    console.error('Error reading posts from localStorage', error);
    try {
      window.localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(MOCK_POSTS));
    } catch {
      // localStorage might be disabled
    }
    return MOCK_POSTS;
  }
};

const CommunityPage: React.FC = () => {
  const { isAuthenticated, socialLogin, currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>(getInitialPosts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'popular'>('feed');
  const toast = useToast();
  const { confirm } = useConfirmation();

  useEffect(() => {
    try {
      const serialized = JSON.stringify(posts);
      window.localStorage.setItem(POSTS_STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Error writing posts to localStorage', error);
      // Don't crash the app if localStorage is full or disabled
    }
  }, [posts]);

  const handleAddPost = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    toast.success('Post shared successfully! 🎉');
  };

  const handleUpdatePost = (postId: number, newContent: string) => {
    setPosts(posts.map((p) => (p.id === postId ? { ...p, content: newContent } : p)));
    toast.success('Post updated!');
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

  // Like/Unlike a post
  const handleLikePost = (postId: number) => {
    if (!currentUser) {
      toast.error('Please sign in to like posts');
      return;
    }
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          const hasLiked = p.likes.includes(currentUser.id);
          return {
            ...p,
            likes: hasLiked
              ? p.likes.filter((id) => id !== currentUser.id)
              : [...p.likes, currentUser.id],
          };
        }
        return p;
      })
    );
  };

  // Like/Unlike a comment
  const handleLikeComment = (postId: number, commentId: number) => {
    if (!currentUser) {
      toast.error('Please sign in to like comments');
      return;
    }
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id === commentId) {
                const hasLiked = c.likes.includes(currentUser.id);
                return {
                  ...c,
                  likes: hasLiked
                    ? c.likes.filter((id) => id !== currentUser.id)
                    : [...c.likes, currentUser.id],
                };
              }
              return c;
            }),
          };
        }
        return p;
      })
    );
  };

  // Like/Unlike a reply
  const handleLikeReply = (postId: number, commentId: number, replyId: number) => {
    if (!currentUser) {
      toast.error('Please sign in to like replies');
      return;
    }
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: c.replies.map((r) => {
                    if (r.id === replyId) {
                      const hasLiked = r.likes.includes(currentUser.id);
                      return {
                        ...r,
                        likes: hasLiked
                          ? r.likes.filter((id) => id !== currentUser.id)
                          : [...r.likes, currentUser.id],
                      };
                    }
                    return r;
                  }),
                };
              }
              return c;
            }),
          };
        }
        return p;
      })
    );
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
      likes: [],
      timestamp: new Date().toISOString(),
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
      likes: [],
      timestamp: new Date().toISOString(),
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

  // Delete comment
  const handleDeleteComment = async (postId: number, commentId: number) => {
    const shouldDelete = await confirm({
      title: 'Delete Comment?',
      message: 'Are you sure you want to delete this comment?',
    });
    if (shouldDelete) {
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p
        )
      );
      toast.success('Comment deleted.');
    }
  };

  // Delete reply
  const handleDeleteReply = async (postId: number, commentId: number, replyId: number) => {
    const shouldDelete = await confirm({
      title: 'Delete Reply?',
      message: 'Are you sure you want to delete this reply?',
    });
    if (shouldDelete) {
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id === commentId
                    ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
                    : c
                ),
              }
            : p
        )
      );
      toast.success('Reply deleted.');
    }
  };

  const handleSocialLogin = async () => {
    setIsLoading(true);
    try {
      const socialUser = await signInWithGoogle();
      await socialLogin(socialUser);
      toast.success('Welcome to the community! 🎉');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error(`Google Sign-In failed`, error);
      toast.error(`Failed to sign in with Google: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort posts based on active tab
  const displayedPosts =
    activeTab === 'popular' ? [...posts].sort((a, b) => b.likes.length - a.likes.length) : posts;

  // Calculate community stats
  const totalPosts = posts.length;
  const totalComments = posts.reduce((acc, p) => acc + p.comments.length, 0);
  const totalLikes = posts.reduce((acc, p) => acc + p.likes.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl animate-fade-in">
        {/* Hero Section */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl md:rounded-2xl mb-3 md:mb-4 shadow-lg">
            <UserGroupIcon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-white mb-2 md:mb-3">
            Community Hub
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Share your pet stories, get advice from fellow pet parents, and be part of Bangladesh's
            most caring pet community.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 md:mb-8">
          <div className="glass-card p-2.5 sm:p-4 text-center hover:scale-105 transition-transform cursor-default">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-500">{totalPosts}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Posts
            </p>
          </div>
          <div className="glass-card p-2.5 sm:p-4 text-center hover:scale-105 transition-transform cursor-default">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500">
              {totalComments}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Comments
            </p>
          </div>
          <div className="glass-card p-2.5 sm:p-4 text-center hover:scale-105 transition-transform cursor-default">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-pink-500">{totalLikes}</p>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Likes
            </p>
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="glass-card p-3 sm:p-4 mb-6 md:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-800/30 border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm">
                Community Guidelines
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5 leading-relaxed">
                Be kind, share helpful tips, and respect fellow pet lovers. Let's make this a safe
                space for everyone! 🐾
              </p>
            </div>
          </div>
        </div>

        {/* Post Creation / Login Section */}
        {isAuthenticated ? (
          <CreatePostForm onAddPost={handleAddPost} />
        ) : (
          <div className="glass-card p-8 mb-8 text-center bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-800 dark:to-slate-800/50">
            <div className="flex justify-center gap-2 mb-4">
              <span className="text-3xl">🐕</span>
              <span className="text-3xl">🐈</span>
              <span className="text-3xl">🐾</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Join the Conversation!
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
              Share your pet stories, get expert advice, and connect with thousands of pet lovers
              across Bangladesh.
            </p>

            <div className="space-y-4 max-w-sm mx-auto">
              <button
                onClick={handleSocialLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <GoogleIcon className="w-6 h-6" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </span>
              </button>
            </div>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
              <span className="flex-shrink mx-4 text-slate-400 dark:text-slate-500 text-sm">
                or use email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
            </div>

            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                className="px-6 py-2.5 font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 sm:p-1.5 rounded-lg sm:rounded-xl">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                activeTab === 'feed'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              📰 Latest
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                activeTab === 'popular'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              🔥 Popular
            </button>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Reset community data? This will clear your local posts.')) {
                window.localStorage.removeItem('petbhai_posts');
                window.location.reload();
              }
            }}
            className="text-[10px] sm:text-xs text-slate-400 hover:text-red-500 transition-colors hidden sm:block"
            title="Reset to default posts"
          >
            Reset
          </button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {displayedPosts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="flex justify-center mb-4">
                <ChatBubbleIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                No posts yet!
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Be the first to share something with the community.
              </p>
            </div>
          ) : (
            displayedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                onLikePost={handleLikePost}
                onLikeComment={handleLikeComment}
                onLikeReply={handleLikeReply}
                onAddComment={handleAddComment}
                onAddReply={handleAddReply}
                onDeleteComment={handleDeleteComment}
                onDeleteReply={handleDeleteReply}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
