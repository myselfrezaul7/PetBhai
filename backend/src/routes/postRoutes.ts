import express from 'express';
import { db } from '../db';
import type { Post, Comment, CommentReply } from '../types';

const router = express.Router();

// Get all posts
router.get('/', (req, res) => {
  // Sort by timestamp, newest first
  const sortedPosts = [...db.posts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  res.json(sortedPosts);
});

// Get single post
router.get('/:id', (req, res) => {
  const post = db.posts.find((p) => p.id === parseInt(req.params.id));
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

// Create a new post
router.post('/', (req, res) => {
  const { author, content, imageUrl } = req.body;

  if (!author || !content) {
    return res.status(400).json({ message: 'Author and content are required' });
  }

  // Check image size (if base64, roughly estimate)
  if (imageUrl && imageUrl.length > 7 * 1024 * 1024) {
    // ~5MB in base64 is about 6.67MB
    return res.status(400).json({ message: 'Image size exceeds 5MB limit' });
  }

  const newPost: Post = {
    id: Date.now(),
    author: {
      id: author.id,
      name: author.name,
      profilePictureUrl: author.profilePictureUrl,
    },
    content,
    imageUrl,
    timestamp: new Date().toISOString(),
    likes: [],
    comments: [],
  };

  db.posts.unshift(newPost); // Add to beginning
  res.status(201).json(newPost);
});

// Update a post
router.put('/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const { content, authorId } = req.body;

  const postIndex = db.posts.findIndex((p) => p.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Check if the user is the author
  if (db.posts[postIndex].author.id !== authorId) {
    return res.status(403).json({ message: 'You can only edit your own posts' });
  }

  db.posts[postIndex] = { ...db.posts[postIndex], content };
  res.json(db.posts[postIndex]);
});

// Delete a post
router.delete('/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  const authorId = parseInt(req.query.authorId as string);

  const postIndex = db.posts.findIndex((p) => p.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Check if the user is the author
  if (db.posts[postIndex].author.id !== authorId) {
    return res.status(403).json({ message: 'You can only delete your own posts' });
  }

  db.posts.splice(postIndex, 1);
  res.json({ message: 'Post deleted successfully' });
});

// Like/Unlike a post
router.post('/:id/like', (req, res) => {
  const postId = parseInt(req.params.id);
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const post = db.posts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const likeIndex = post.likes.indexOf(userId);
  if (likeIndex === -1) {
    post.likes.push(userId);
  } else {
    post.likes.splice(likeIndex, 1);
  }

  res.json(post);
});

// Add a comment to a post
router.post('/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id);
  const { author, text } = req.body;

  if (!author || !text) {
    return res.status(400).json({ message: 'Author and text are required' });
  }

  const post = db.posts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const newComment: Comment = {
    id: Date.now(),
    author: {
      id: author.id,
      name: author.name,
      profilePictureUrl: author.profilePictureUrl,
    },
    text,
    replies: [],
    likes: [],
    timestamp: new Date().toISOString(),
  };

  post.comments.push(newComment);
  res.status(201).json(newComment);
});

// Like/Unlike a comment
router.post('/:postId/comments/:commentId/like', (req, res) => {
  const postId = parseInt(req.params.postId);
  const commentId = parseInt(req.params.commentId);
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const post = db.posts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = post.comments.find((c) => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const likeIndex = comment.likes.indexOf(userId);
  if (likeIndex === -1) {
    comment.likes.push(userId);
  } else {
    comment.likes.splice(likeIndex, 1);
  }

  res.json(comment);
});

// Add a reply to a comment
router.post('/:postId/comments/:commentId/replies', (req, res) => {
  const postId = parseInt(req.params.postId);
  const commentId = parseInt(req.params.commentId);
  const { author, text } = req.body;

  if (!author || !text) {
    return res.status(400).json({ message: 'Author and text are required' });
  }

  const post = db.posts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = post.comments.find((c) => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const newReply: CommentReply = {
    id: Date.now(),
    author: {
      id: author.id,
      name: author.name,
      profilePictureUrl: author.profilePictureUrl,
    },
    text,
    likes: [],
    timestamp: new Date().toISOString(),
  };

  comment.replies.push(newReply);
  res.status(201).json(newReply);
});

// Like/Unlike a reply
router.post('/:postId/comments/:commentId/replies/:replyId/like', (req, res) => {
  const postId = parseInt(req.params.postId);
  const commentId = parseInt(req.params.commentId);
  const replyId = parseInt(req.params.replyId);
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const post = db.posts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  const comment = post.comments.find((c) => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ message: 'Comment not found' });
  }

  const reply = comment.replies.find((r) => r.id === replyId);
  if (!reply) {
    return res.status(404).json({ message: 'Reply not found' });
  }

  const likeIndex = reply.likes.indexOf(userId);
  if (likeIndex === -1) {
    reply.likes.push(userId);
  } else {
    reply.likes.splice(likeIndex, 1);
  }

  res.json(reply);
});

export default router;
