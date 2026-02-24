import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CreatePostForm from '../components/CreatePostForm';
import PostCard from '../components/PostCard';
import { useAuth } from '../contexts/AuthContext';
import type { Post } from '../types';
import { GoogleIcon, UserGroupIcon, HeartIcon, ChatBubbleIcon, PawIcon } from '../components/icons';
import { signInWithGoogle } from '../services/authService';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import * as postService from '../services/postService';
import { API_BASE_URL } from '../services/apiClient';

const CommunityPage: React.FC = () => {
  const { isAuthenticated, socialLogin, currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'popular' | 'trending'>('feed');
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const toast = useToast();
  const { confirm } = useConfirmation();

  // Fetch posts from API
  const fetchPosts = useCallback(
    async (options?: { silent?: boolean; showErrors?: boolean }) => {
      const silent = options?.silent ?? false;
      const showErrors = options?.showErrors ?? true;

      if (!silent) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const feed = await postService.fetchPostsPage(undefined, 10);
        setPosts(feed.items);
        setNextCursor(feed.nextCursor);
        setHasMore(feed.hasMore);
        setLastSyncAt(new Date().toISOString());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load posts.';
        console.warn('API unavailable:', error);
        setPosts([]);
        setError(message);
        if (showErrors) {
          toast.error(message);
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [toast]
  );

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    let cancelled = false;
    const flushQueue = async () => {
      try {
        const result = await postService.flushQueuedMutations();
        if (!cancelled && result.processed > 0) {
          toast.success(`Synced ${result.processed} queued community action(s).`);
          void fetchPosts({ silent: true, showErrors: false });
        }
      } catch {
        // keep queued actions for next retry
      }
    };

    void flushQueue();
    return () => {
      cancelled = true;
    };
  }, [fetchPosts, toast]);

  const loadMorePosts = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const feed = await postService.fetchPostsPage(nextCursor, 10);
      setPosts((prevPosts) => {
        const existingIds = new Set(prevPosts.map((post) => post.id));
        const deduped = feed.items.filter((post) => !existingIds.has(post.id));
        return [...prevPosts, ...deduped];
      });
      setNextCursor(feed.nextCursor);
      setHasMore(feed.hasMore);
      setLastSyncAt(new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load more posts.';
      toast.error(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, nextCursor, isLoadingMore, toast]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLive(false);
      return;
    }

    let isDisposed = false;
    const streamUrl = `${API_BASE_URL}/posts/stream`;
    const eventSource = new EventSource(streamUrl, { withCredentials: true });

    const syncInBackground = () => {
      void fetchPosts({ silent: true, showErrors: false });
    };

    const onConnected = () => {
      if (isDisposed) return;
      setIsLive(true);
      syncInBackground();
    };

    const onPostUpdate = () => {
      if (isDisposed) return;
      setIsLive(true);
      syncInBackground();
    };

    const onError = () => {
      if (isDisposed) return;
      setIsLive(false);
      eventSource.close();
    };

    eventSource.addEventListener('connected', onConnected);
    eventSource.addEventListener('post-update', onPostUpdate);
    eventSource.addEventListener('error', onError);

    const fallbackPolling = window.setInterval(() => {
      if (!isDisposed) {
        syncInBackground();
      }
    }, 15000);

    return () => {
      isDisposed = true;
      setIsLive(false);
      window.clearInterval(fallbackPolling);
      eventSource.removeEventListener('connected', onConnected);
      eventSource.removeEventListener('post-update', onPostUpdate);
      eventSource.removeEventListener('error', onError);
      eventSource.close();
    };
  }, [fetchPosts, isAuthenticated]);

  const handleAddPost = async (newPost: Post) => {
    if (!currentUser) {
      toast.error('Please sign in to share a post.');
      return;
    }

    const optimisticId = Date.now() * -1;
    const optimisticPost: Post = {
      id: optimisticId,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        profilePictureUrl: currentUser.profilePictureUrl,
      },
      content: newPost.content,
      imageUrl: newPost.imageUrl,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: [],
    };

    setPosts((prevPosts) => [optimisticPost, ...prevPosts]);

    try {
      const createdPost = await postService.createPost(
        {
          id: currentUser.id,
          name: currentUser.name,
          profilePictureUrl: currentUser.profilePictureUrl,
        },
        newPost.content,
        newPost.imageUrl
      );
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === optimisticId ? createdPost : post))
      );
      toast.success('Post shared successfully! 🎉');
    } catch (error) {
      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== optimisticId));
      postService.enqueueFailedMutation({
        type: 'createPost',
        payload: {
          author: {
            id: currentUser.id,
            name: currentUser.name,
            profilePictureUrl: currentUser.profilePictureUrl,
          },
          content: newPost.content,
          imageUrl: newPost.imageUrl,
        },
      });
      const message = error instanceof Error ? error.message : 'Failed to share post.';
      toast.error(`${message} Saved to retry queue.`);
    }
  };

  const handleUpdatePost = async (postId: number, newContent: string) => {
    if (!currentUser) {
      toast.error('Please sign in to update a post.');
      return;
    }

    try {
      const updatedPost = await postService.updatePost(postId, newContent, currentUser.id);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
      toast.success('Post updated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update post.';
      toast.error(message);
    }
  };

  const handleDeletePost = async (postId: number) => {
    const shouldDelete = await confirm({
      title: 'Delete Post?',
      message: 'Are you sure you want to delete this post? This action cannot be undone.',
    });
    if (!shouldDelete) return;

    if (!currentUser) {
      toast.error('Please sign in to delete a post.');
      return;
    }

    try {
      await postService.deletePost(postId, currentUser.id);
      setPosts(posts.filter((p) => p.id !== postId));
      toast.success('Post deleted successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete post.';
      toast.error(message);
    }
  };

  // Like/Unlike a post
  const handleLikePost = async (postId: number) => {
    if (!currentUser) {
      toast.error('Please sign in to like posts');
      return;
    }

    const previousPosts = posts;
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;
        const alreadyLiked = post.likes.includes(currentUser.id);
        return {
          ...post,
          likes: alreadyLiked
            ? post.likes.filter((id) => id !== currentUser.id)
            : [...post.likes, currentUser.id],
        };
      })
    );

    try {
      const updatedPost = await postService.togglePostLike(postId, currentUser.id);
      setPosts(posts.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (error) {
      setPosts(previousPosts);
      postService.enqueueFailedMutation({
        type: 'togglePostLike',
        payload: {
          postId,
          userId: currentUser.id,
        },
      });
      const message = error instanceof Error ? error.message : 'Failed to update like.';
      toast.error(`${message} Saved to retry queue.`);
    }
  };

  // Like/Unlike a comment
  const handleLikeComment = async (postId: number, commentId: number) => {
    if (!currentUser) {
      toast.error('Please sign in to like comments');
      return;
    }

    try {
      const updatedComment = await postService.toggleCommentLike(postId, commentId, currentUser.id);
      const updated = posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.map((c) => (c.id === commentId ? updatedComment : c)),
          };
        }
        return p;
      });
      setPosts(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update comment like.';
      toast.error(message);
    }
  };

  // Like/Unlike a reply
  const handleLikeReply = async (postId: number, commentId: number, replyId: number) => {
    if (!currentUser) {
      toast.error('Please sign in to like replies');
      return;
    }

    try {
      const updatedReply = await postService.toggleReplyLike(
        postId,
        commentId,
        replyId,
        currentUser.id
      );
      const updated = posts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: c.replies.map((r) => (r.id === replyId ? updatedReply : r)),
                };
              }
              return c;
            }),
          };
        }
        return p;
      });
      setPosts(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update reply like.';
      toast.error(message);
    }
  };

  const handleAddComment = async (postId: number, commentText: string) => {
    if (!currentUser) {
      toast.error('Please sign in to comment on posts.');
      return;
    }

    const optimisticCommentId = Date.now() * -1;
    const optimisticComment = {
      id: optimisticCommentId,
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

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, optimisticComment] } : post
      )
    );

    try {
      const createdComment = await postService.addComment(
        postId,
        {
          id: currentUser.id,
          name: currentUser.name,
          profilePictureUrl: currentUser.profilePictureUrl,
        },
        commentText
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === optimisticCommentId ? createdComment : comment
                ),
              }
            : post
        )
      );
    } catch (error) {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.filter((comment) => comment.id !== optimisticCommentId),
              }
            : post
        )
      );
      postService.enqueueFailedMutation({
        type: 'addComment',
        payload: {
          postId,
          author: {
            id: currentUser.id,
            name: currentUser.name,
            profilePictureUrl: currentUser.profilePictureUrl,
          },
          text: commentText,
        },
      });
      const message = error instanceof Error ? error.message : 'Failed to add comment.';
      toast.error(`${message} Saved to retry queue.`);
    }
  };

  const handleAddReply = async (postId: number, commentId: number, replyText: string) => {
    if (!currentUser) {
      toast.error('Please sign in to reply to comments.');
      return;
    }

    const optimisticReplyId = Date.now() * -1;
    const optimisticReply = {
      id: optimisticReplyId,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        profilePictureUrl: currentUser.profilePictureUrl,
      },
      text: replyText,
      likes: [],
      timestamp: new Date().toISOString(),
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? { ...comment, replies: [...comment.replies, optimisticReply] }
                  : comment
              ),
            }
          : post
      )
    );

    try {
      const createdReply = await postService.addReply(
        postId,
        commentId,
        {
          id: currentUser.id,
          name: currentUser.name,
          profilePictureUrl: currentUser.profilePictureUrl,
        },
        replyText
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        replies: comment.replies.map((reply) =>
                          reply.id === optimisticReplyId ? createdReply : reply
                        ),
                      }
                    : comment
                ),
              }
            : post
        )
      );
    } catch (error) {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id === commentId
                    ? {
                        ...comment,
                        replies: comment.replies.filter((reply) => reply.id !== optimisticReplyId),
                      }
                    : comment
                ),
              }
            : post
        )
      );
      postService.enqueueFailedMutation({
        type: 'addReply',
        payload: {
          postId,
          commentId,
          author: {
            id: currentUser.id,
            name: currentUser.name,
            profilePictureUrl: currentUser.profilePictureUrl,
          },
          text: replyText,
        },
      });
      const message = error instanceof Error ? error.message : 'Failed to add reply.';
      toast.error(`${message} Saved to retry queue.`);
    }
  };

  // Delete comment
  const handleDeleteComment = async (_postId: number, _commentId: number) => {
    await confirm({
      title: 'Delete Comment?',
      message: 'Comment deletion is not available yet.',
      confirmText: 'OK',
      cancelText: 'Close',
    });
    toast.error('Comment deletion is not available yet.');
  };

  // Delete reply
  const handleDeleteReply = async (_postId: number, _commentId: number, _replyId: number) => {
    await confirm({
      title: 'Delete Reply?',
      message: 'Reply deletion is not available yet.',
      confirmText: 'OK',
      cancelText: 'Close',
    });
    toast.error('Reply deletion is not available yet.');
  };

  // Update comment
  const handleUpdateComment = (_postId: number, _commentId: number, _newText: string) => {
    toast.error('Comment editing is not available yet.');
  };

  // Update reply
  const handleUpdateReply = (
    _postId: number,
    _commentId: number,
    _replyId: number,
    _newText: string
  ) => {
    toast.error('Reply editing is not available yet.');
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

  // Handle tab change
  const handleTabChange = useCallback((tab: 'feed' | 'popular' | 'trending') => {
    setActiveTab(tab);
  }, []);

  // Sort posts based on active tab - memoized
  const displayedPosts = useMemo(() => {
    if (activeTab === 'popular') {
      return [...posts].sort((a, b) => b.likes.length - a.likes.length);
    }
    if (activeTab === 'trending') {
      // Trending: Recent posts with most engagement in last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return [...posts]
        .filter((p) => new Date(p.timestamp) >= sevenDaysAgo)
        .sort((a, b) => {
          const engagementA = a.likes.length + a.comments.length;
          const engagementB = b.likes.length + b.comments.length;
          return engagementB - engagementA;
        });
    }
    return posts;
  }, [activeTab, posts]);

  // Trending topics based on post content
  const trendingTopics = useMemo(() => {
    const topicCounts: Record<string, number> = {};
    const topics = [
      'Training',
      'Health',
      'Adoption',
      'Food',
      'Grooming',
      'Behavior',
      'Rescue',
      'Vaccination',
    ];

    posts.forEach((post) => {
      const content = (post.content || '').toLowerCase();
      topics.forEach((topic) => {
        if (content.includes(topic.toLowerCase())) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }, [posts]);

  // Community leaderboard - most active users
  const leaderboard = useMemo(() => {
    const userStats: Record<
      string,
      { name: string; posts: number; comments: number; likes: number; profilePictureUrl?: string }
    > = {};

    posts.forEach((post) => {
      const authorId = post.author.id.toString();
      if (!userStats[authorId]) {
        userStats[authorId] = {
          name: post.author.name,
          posts: 0,
          comments: 0,
          likes: 0,
          profilePictureUrl: post.author.profilePictureUrl,
        };
      }
      userStats[authorId].posts++;
      userStats[authorId].likes += post.likes.length;

      post.comments.forEach((comment) => {
        const commenterId = comment.author.id.toString();
        if (!userStats[commenterId]) {
          userStats[commenterId] = {
            name: comment.author.name,
            posts: 0,
            comments: 0,
            likes: 0,
            profilePictureUrl: comment.author.profilePictureUrl,
          };
        }
        userStats[commenterId].comments++;
      });
    });

    return Object.entries(userStats)
      .map(([id, stats]) => ({
        id,
        ...stats,
        score: stats.posts * 10 + stats.comments * 3 + stats.likes,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [posts]);

  // User badge system
  const getUserBadge = useCallback(
    (userId: number) => {
      const userPosts = posts.filter((p) => p.author.id === userId);
      const postCount = userPosts.length;
      const totalLikes = userPosts.reduce((sum, p) => sum + p.likes.length, 0);

      if (postCount >= 20 || totalLikes >= 100)
        return { emoji: '🏆', name: 'Legend', color: 'text-yellow-500' };
      if (postCount >= 10 || totalLikes >= 50)
        return { emoji: '⭐', name: 'Star', color: 'text-purple-500' };
      if (postCount >= 5 || totalLikes >= 20)
        return { emoji: '🌟', name: 'Active', color: 'text-blue-500' };
      if (postCount >= 1) return { emoji: '🐾', name: 'Newcomer', color: 'text-green-500' };
      return null;
    },
    [posts]
  );

  // Calculate community stats - memoized
  const communityStats = useMemo(
    () => ({
      totalPosts: posts.length,
      totalComments: posts.reduce((acc, p) => acc + p.comments.length, 0),
      totalLikes: posts.reduce((acc, p) => acc + p.likes.length, 0),
    }),
    [posts]
  );

  return (
    <main className="min-h-screen bg-slate-50/40 dark:bg-slate-950/50">
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        {/* Hero Section */}
        <header className="text-center mb-6 md:mb-8 rounded-2xl border border-slate-200 bg-white/90 dark:border-slate-700 dark:bg-slate-900/80 p-5 md:p-8 shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-orange-50 dark:bg-orange-900/20 rounded-xl md:rounded-2xl mb-3 md:mb-4">
            <UserGroupIcon
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-orange-500"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-white mb-2 md:mb-3">
            Community Hub
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Share your pet stories, get advice from fellow pet parents, and be part of Bangladesh's
            most caring pet community.
          </p>
          {isAuthenticated && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
              {isLive ? 'Live updates on' : 'Reconnecting...'}
              {lastSyncAt ? ` • synced ${new Date(lastSyncAt).toLocaleTimeString()}` : ''}
            </div>
          )}
        </header>

        {/* Stats Bar */}
        <section
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 md:mb-8"
          aria-label="Community statistics"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {communityStats.totalPosts}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Posts
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {communityStats.totalComments}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Comments
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-4 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {communityStats.totalLikes}
            </p>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Likes
            </p>
          </div>
        </section>

        {/* Trending Topics & Leaderboard Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 md:mb-8">
          {/* Trending Topics */}
          {trendingTopics.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-lg">🔥</span>
                Trending Topics
              </h3>
              <div className="space-y-2">
                {trendingTopics.map(({ topic, count }) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
                      #{topic}
                    </span>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full">
                      {count} posts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Toggle */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <span className="text-lg">👑</span>
              Top Contributors
            </h3>
            {leaderboard.slice(0, 3).map((user, idx) => {
              const badge = getUserBadge(parseInt(user.id));
              return (
                <div key={user.id} className="flex items-center gap-2 mb-2 last:mb-0">
                  <span className="text-sm font-bold text-slate-400 w-4">{idx + 1}.</span>
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-[10px] font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium flex-1 truncate">
                    {user.name}
                  </span>
                  {badge && (
                    <span className="text-sm" title={badge.name}>
                      {badge.emoji}
                    </span>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="mt-3 w-full text-xs text-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold"
            >
              {showLeaderboard ? 'Hide Full Leaderboard' : 'View Full Leaderboard'}
            </button>
          </div>
        </div>

        {/* Full Leaderboard Modal */}
        {showLeaderboard && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowLeaderboard(false)}
          >
            <div
              className="glass-card-ios p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-white/35 dark:border-white/10 bg-white/65 dark:bg-slate-900/70 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span>👑</span>
                  Community Leaderboard
                </h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                {leaderboard.map((user, idx) => {
                  const badge = getUserBadge(parseInt(user.id));
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <span className="text-lg font-bold text-slate-400 w-6">{idx + 1}</span>
                      {user.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {user.posts} posts • {user.comments} comments • {user.likes} likes
                        </p>
                      </div>
                      {badge && (
                        <div className="text-right">
                          <span className="text-2xl" title={badge.name}>
                            {badge.emoji}
                          </span>
                          <p className={`text-xs font-bold ${badge.color}`}>{badge.name}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Community Guidelines */}
        <aside
          className="glass-card-ios p-3 sm:p-4 mb-6 md:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-800/30 border border-blue-100 dark:border-blue-900/30"
          aria-label="Community guidelines"
        >
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-800 dark:text-white text-xs sm:text-sm">
                Community Guidelines
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-0.5 leading-relaxed">
                Be kind, share helpful tips, and respect fellow pet lovers. Let's make this a safe
                space for everyone! 🐾
              </p>
            </div>
          </div>
        </aside>

        {/* Post Creation / Login Section */}
        {isAuthenticated ? (
          <CreatePostForm onAddPost={handleAddPost} />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 mb-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
        <nav
          className="flex items-center justify-between mb-4 sm:mb-6"
          aria-label="Post feed filters"
        >
          <div className="flex space-x-1 rounded-xl border border-slate-200 bg-white p-1 sm:p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => handleTabChange('feed')}
              data-active={activeTab === 'feed'}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-lg font-semibold transition-all text-xs sm:text-sm active:scale-95 touch-manipulation ${
                activeTab === 'feed'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => handleTabChange('trending')}
              data-active={activeTab === 'trending'}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-lg font-semibold transition-all text-xs sm:text-sm active:scale-95 touch-manipulation ${
                activeTab === 'trending'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => handleTabChange('popular')}
              data-active={activeTab === 'popular'}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-lg font-semibold transition-all text-xs sm:text-sm active:scale-95 touch-manipulation ${
                activeTab === 'popular'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Popular
            </button>
          </div>
          <button
            onClick={fetchPosts}
            className="text-[10px] sm:text-xs text-slate-400 hover:text-orange-500 transition-colors hidden sm:block px-2 py-1 rounded active:scale-95 touch-manipulation"
            title="Refresh posts"
            aria-label="Refresh posts"
          >
            Refresh
          </button>
        </nav>

        {/* Posts Feed */}
        <section className="space-y-4 sm:space-y-6" aria-label="Community posts">
          {isLoading ? (
            <div
              className="space-y-4 sm:space-y-6"
              role="status"
              aria-label="Loading community posts"
            >
              <span className="sr-only">Loading posts...</span>
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card-ios p-4 sm:p-6 animate-pulse" aria-hidden="true">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 sm:w-32 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 sm:w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </div>
                  <div className="mt-4 h-48 sm:h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-card-ios p-8 text-center" role="alert">
              <div className="flex justify-center mb-4">
                <PawIcon className="w-12 h-12 text-orange-400" aria-hidden="true" />
              </div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Unable to load community posts.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
              <button
                onClick={fetchPosts}
                className="px-6 py-2 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors touch-manipulation active:scale-95"
              >
                Try Again
              </button>
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="glass-card-ios p-12 text-center" role="status">
              <div className="flex justify-center mb-4">
                <ChatBubbleIcon
                  className="w-12 h-12 text-slate-300 dark:text-slate-600"
                  aria-hidden="true"
                />
              </div>
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
                No posts yet!
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Be the first to share something with the community.
              </p>
            </div>
          ) : (
            <>
              {displayedPosts.map((post) => (
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
                  onUpdateComment={handleUpdateComment}
                  onUpdateReply={handleUpdateReply}
                  onDeleteComment={handleDeleteComment}
                  onDeleteReply={handleDeleteReply}
                />
              ))}
              {hasMore && activeTab === 'feed' && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMorePosts}
                    disabled={isLoadingMore}
                    className="px-5 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default CommunityPage;
