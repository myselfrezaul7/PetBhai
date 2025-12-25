import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CreatePostForm from '../components/CreatePostForm';
import PostCard from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { MOCK_POSTS } from '../constants';
import type { Post, Comment, CommentReply } from '../types';
import { GoogleIcon, VideoCameraIcon, UserGroupIcon } from '../components/icons';
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
  const [activeTab, setActiveTab] = useState<'feed' | 'popular'>('feed');
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
            <UserGroupIcon className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-3">
            Community Hub
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Share pet care tips, product reviews, and connect with fellow pet lovers in Bangladesh.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{totalPosts}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Posts</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{totalComments}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Comments</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-pink-500">{totalLikes}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Likes</p>
          </div>
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

        {/* Post Creation / Login Section */}
        {isAuthenticated ? (
          <CreatePostForm onAddPost={handleAddPost} />
        ) : (
          <div className="glass-card p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              Join the Conversation! 🐾
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Sign in to share your stories, like posts, and connect with our community.
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-full">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              📰 Latest
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'popular'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
            className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            Reset Data
          </button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {displayedPosts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                No posts yet! 📝
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
