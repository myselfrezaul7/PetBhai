import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import { subscribeAdminClient } from '../realtime/adminEvents';

const router = Router();

router.get('/stream', (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';
  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  const decoded = verifyToken(token);
  if (!decoded?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const unsubscribe = subscribeAdminClient(res);

  req.on('close', () => {
    unsubscribe();
  });
});

export default router;
