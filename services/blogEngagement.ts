import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface EngagementState {
  likeCount: number;
  commentCount: number;
  viewCount: number;
}

// Helper to initialize article doc if it doesn't exist
const ensureArticleDoc = async (articleId: string | number) => {
  if (!db) return;
  const docRef = doc(db, 'articles', String(articleId));
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    try {
      await setDoc(docRef, {
        likeCount: 0,
        likedBy: [],
        commentCount: 0,
        viewCount: 0
      });
    } catch (e) {
      console.warn('Failed to initialize article doc:', e);
    }
  }
};

/**
 * Toggles a like for the given user.
 */
export const toggleLike = async (articleId: string | number, userId: string, isCurrentlyLiked: boolean) => {
  if (!db) return;
  const docRef = doc(db, 'articles', String(articleId));
  
  await ensureArticleDoc(articleId);

  try {
    if (isCurrentlyLiked) {
      await updateDoc(docRef, {
        likedBy: arrayRemove(userId),
        likeCount: increment(-1)
      });
    } else {
      await updateDoc(docRef, {
        likedBy: arrayUnion(userId),
        likeCount: increment(1)
      });
    }
  } catch (e) {
    console.error('Error toggling like:', e);
    throw e;
  }
};

/**
 * Adds a new comment.
 */
export const addComment = async (articleId: string | number, userId: string, userName: string, text: string) => {
  if (!db) return null;
  const articleRef = doc(db, 'articles', String(articleId));
  const commentsRef = collection(articleRef, 'comments');

  await ensureArticleDoc(articleId);

  try {
    const docRef = await addDoc(commentsRef, {
      userId,
      userName,
      text,
      createdAt: serverTimestamp()
    });
    
    // Increment comment count on the main article document
    await updateDoc(articleRef, {
      commentCount: increment(1)
    });
    
    return docRef.id;
  } catch (e) {
    console.error('Error adding comment:', e);
    throw e;
  }
};

/**
 * Deletes a comment.
 */
export const deleteComment = async (articleId: string | number, commentId: string) => {
  if (!db) return;
  const commentRef = doc(db, 'articles', String(articleId), 'comments', commentId);
  const articleRef = doc(db, 'articles', String(articleId));

  try {
    await deleteDoc(commentRef);
    await updateDoc(articleRef, {
      commentCount: increment(-1)
    });
  } catch (e) {
    console.error('Error deleting comment:', e);
    throw e;
  }
};

/**
 * Increments the view count. Should be called once per session.
 */
export const incrementViews = async (articleId: string | number) => {
  if (!db) return;
  
  // Prevent duplicate views in the same session
  const viewedKey = `viewed_${articleId}`;
  if (sessionStorage.getItem(viewedKey)) return;
  sessionStorage.setItem(viewedKey, 'true');

  const docRef = doc(db, 'articles', String(articleId));
  await ensureArticleDoc(articleId);

  try {
    await updateDoc(docRef, {
      viewCount: increment(1)
    });
  } catch (e) {
    console.warn('Error incrementing views:', e);
  }
};

/**
 * Subscribes to the engagement counts (likes, views, total comments).
 */
export const subscribeEngagement = (
  articleId: string | number, 
  userId: string | null,
  callback: (state: EngagementState, isLikedByMe: boolean) => void
) => {
  if (!db) return () => {};
  
  const docRef = doc(db, 'articles', String(articleId));
  
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const likedBy = data.likedBy || [];
      callback({
        likeCount: data.likeCount || 0,
        commentCount: data.commentCount || 0,
        viewCount: data.viewCount || 0
      }, userId ? likedBy.includes(userId) : false);
    } else {
      callback({ likeCount: 0, commentCount: 0, viewCount: 0 }, false);
    }
  });
};

/**
 * Subscribes to the latest comments.
 */
export const subscribeComments = (
  articleId: string | number, 
  limitCount: number = 20,
  callback: (comments: Comment[]) => void
) => {
  if (!db) return () => {};

  const commentsRef = collection(db, 'articles', String(articleId), 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const comments: Comment[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      comments.push({
        id: docSnap.id,
        userId: data.userId,
        userName: data.userName,
        text: data.text,
        createdAt: data.createdAt?.toMillis() || Date.now()
      });
    });
    callback(comments);
  });
};

/**
 * Native web share fallback.
 */
export const shareArticle = async (url: string, title: string, text: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Error sharing:', e);
      }
      return false;
    }
  } else {
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      return 'clipboard';
    } catch (e) {
      console.error('Clipboard copy failed', e);
      return false;
    }
  }
};
