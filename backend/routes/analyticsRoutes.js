import express from 'express';
import { heartbeat, getPlayStats } from '../controllers/analyticsController.js';
import { authenticateUser } from './auth.js';

const router = express.Router();

/**
 * POST /api/analytics/heartbeat
 * Public-ish: auth is optional so anonymous listeners are tracked too.
 * We attempt to decode the token if present but never reject unauthenticated requests.
 */
function optionalAuth(req, res, next) {
  const token = req.header('Authorization');
  if (!token) return next(); // anonymous — fine
  // Delegate to the real middleware but swallow auth errors
  authenticateUser(req, res, (err) => {
    // If auth failed, just continue without req.user
    next();
  });
}

router.post('/heartbeat', optionalAuth, heartbeat);

/**
 * GET /api/analytics/play-stats/:beatId
 * Requires auth (producer or admin).
 */
router.get('/play-stats/:beatId', authenticateUser, getPlayStats);

export default router;