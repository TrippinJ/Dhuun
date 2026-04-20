import mongoose from 'mongoose';

/**
 * PlayEvent
 * One document per listening session (upserted on every heartbeat).
 *
 * playType classification (set by the server on each heartbeat):
 *   'click'   – < 10 s  listened
 *   'partial' – 10–29 s listened
 *   'quality' – ≥ 30 s  listened  ← also triggers Beat.plays increment (once)
 */
const PlayEventSchema = new mongoose.Schema(
  {
    beatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beat',
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,   // one doc per session; we upsert on this key
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** Last reported playback position (0–100) */
    percent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    /** Cumulative seconds listened (server-authoritative) */
    totalSeconds: {
      type: Number,
      default: 0,
    },
    playType: {
      type: String,
      enum: ['click', 'partial', 'quality'],
      default: 'click',
    },
    /** True once Beat.plays has been incremented for this session */
    qualityCounted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PlayEvent', PlayEventSchema);