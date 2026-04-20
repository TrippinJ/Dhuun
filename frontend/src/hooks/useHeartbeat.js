import { useEffect, useRef, useCallback } from 'react';
import API from '../api/api';

const HEARTBEAT_INTERVAL_MS = 10_000; // 10 seconds

/**
 * useHeartbeat
 *
 * Fires POST /api/analytics/heartbeat every 10 s while `isPlaying` is true.
 * Generates a fresh sessionId whenever `beatId` changes so each discrete
 * listening session is tracked independently.
 *
 * @param {string|null}  beatId     – MongoDB _id of the currently loaded beat
 * @param {boolean}      isPlaying  – Whether audio is actively playing
 * @param {number}       percent    – Current playback position as 0-100
 */
function useHeartbeat(beatId, isPlaying, percent) {
  const sessionIdRef  = useRef(null);
  const intervalRef   = useRef(null);
  const prevBeatIdRef = useRef(null);

  /** Generate a new sessionId (UUID v4 via Web Crypto, with a fallback) */
  const newSessionId = useCallback(() => {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback for environments without crypto.randomUUID
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
  }, []);

  /** Send a single heartbeat to the server */
  const sendHeartbeat = useCallback(async (bid, sid, pct) => {
    if (!bid || !sid) return;
    try {
      await API.post('/api/analytics/heartbeat', {
        beatId:    bid,
        sessionId: sid,
        percent:   Math.round(pct),
      });
    } catch (err) {
      // Silently swallow – analytics failures must never affect playback UX
      console.warn('[useHeartbeat] failed to send heartbeat:', err?.message);
    }
  }, []);

  /** Start the 10-second polling interval */
  const startPolling = useCallback((bid, sid, getPct) => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      sendHeartbeat(bid, sid, getPct());
    }, HEARTBEAT_INTERVAL_MS);
  }, [sendHeartbeat]);

  /** Stop polling */
  const stopPolling = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  // We need a ref to `percent` so the interval closure always reads the latest value
  const percentRef = useRef(percent);
  useEffect(() => { percentRef.current = percent; }, [percent]);

  useEffect(() => {
    // ── Track change: reset session ──────────────────────────────────────────
    if (beatId !== prevBeatIdRef.current) {
      stopPolling();
      sessionIdRef.current  = beatId ? newSessionId() : null;
      prevBeatIdRef.current = beatId;
    }

    // ── Play/pause toggle ────────────────────────────────────────────────────
    if (isPlaying && beatId && sessionIdRef.current) {
      startPolling(beatId, sessionIdRef.current, () => percentRef.current);
    } else {
      stopPolling();
    }

    return stopPolling; // cleanup on unmount
  }, [beatId, isPlaying, newSessionId, startPolling, stopPolling]);
}

export default useHeartbeat;