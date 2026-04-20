import PlayEvent from '../models/playEvent.js';
import Beat from '../models/beat.js';

/**
 * In-memory session registry.
 * Keeps a lightweight record of active sessions so we can accumulate
 * totalSeconds server-side and avoid trusting the client for timing.
 *
 * Structure:
 *   sessionId -> { beatId, totalSeconds, qualityCounted, lastSeen }
 *
 * Entries are pruned once a session goes 5 minutes without a heartbeat
 * (the client sends every 10 s while playing, so 5 min = long pause/close).
 */
const sessions = new Map();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Remove stale sessions to prevent unbounded memory growth */
function pruneStaleSession() {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.lastSeen > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

// Prune every 10 minutes
setInterval(pruneStaleSession, 10 * 60 * 1000);

// ─── Thresholds ───────────────────────────────────────────────────────────────
const QUALITY_THRESHOLD_S = 30;   // ≥ 30 s → quality play
const CLICK_THRESHOLD_S   = 10;   // < 10 s → click (never crossed the partial boundary)

/**
 * Classify a session based on accumulated seconds.
 * @param {number} totalSeconds
 * @returns {'click'|'partial'|'quality'}
 */
function classify(totalSeconds) {
  if (totalSeconds >= QUALITY_THRESHOLD_S) return 'quality';
  if (totalSeconds >= CLICK_THRESHOLD_S)   return 'partial';
  return 'click';
}

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * POST /api/analytics/heartbeat
 *
 * Body: { beatId: string, sessionId: string, percent: number }
 *
 * The client (useHeartbeat hook) calls this every 10 seconds while audio plays.
 * Auth is optional – anonymous listeners are tracked too.
 */
export const heartbeat = async (req, res) => {
  try {
    const { beatId, sessionId, percent } = req.body;

    // ── Basic validation ────────────────────────────────────────────────────
    if (!beatId || !sessionId) {
      return res.status(400).json({ success: false, message: 'beatId and sessionId are required' });
    }

    const pct = Math.max(0, Math.min(100, Number(percent) || 0));

    // ── Session state ───────────────────────────────────────────────────────
    let session = sessions.get(sessionId);

    if (!session) {
      // First heartbeat for this session – initialise
      session = {
        beatId,
        totalSeconds: 0,
        qualityCounted: false,
        lastSeen: Date.now(),
      };
      sessions.set(sessionId, session);
    }

    // Each heartbeat = 10 s of listening (client fires every 10 s)
    session.totalSeconds += 10;
    session.lastSeen = Date.now();

    const playType       = classify(session.totalSeconds);
    const justQualified  = playType === 'quality' && !session.qualityCounted;

    // Mark quality counted in-memory immediately (idempotency guard)
    if (justQualified) session.qualityCounted = true;

    // ── Persist / upsert PlayEvent ──────────────────────────────────────────
    const userId = req.user?._id ?? null;

    await PlayEvent.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          beatId,
          userId,
          percent: pct,
          totalSeconds: session.totalSeconds,
          playType,
          qualityCounted: session.qualityCounted,
        },
      },
      { upsert: true, new: true }
    );

    // ── Promote Beat.plays counter (once per session, on quality threshold) ─
    if (justQualified) {
      await Beat.findByIdAndUpdate(beatId, { $inc: { plays: 1 } });
    }

    return res.status(200).json({
      success: true,
      totalSeconds: session.totalSeconds,
      playType,
    });
  } catch (err) {
    console.error('[heartbeat] error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/analytics/play-stats/:beatId
 *
 * Returns aggregated play stats for a beat (admin / producer use).
 */
export const getPlayStats = async (req, res) => {
  try {
    const { beatId } = req.params;

    const [stats] = await PlayEvent.aggregate([
      { $match: { beatId: new (await import('mongoose')).default.Types.ObjectId(beatId) } },
      {
        $group: {
          _id: '$playType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Reshape into a friendly object
    const raw = await PlayEvent.aggregate([
      { $match: { beatId: new (await import('mongoose')).default.Types.ObjectId(beatId) } },
      {
        $group: {
          _id: '$playType',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { click: 0, partial: 0, quality: 0, total: 0 };
    for (const r of raw) {
      result[r._id] = r.count;
      result.total += r.count;
    }

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[getPlayStats] error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};