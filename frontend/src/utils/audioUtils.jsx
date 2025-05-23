

/**
 * Get a consistent ID from a beat object
 * Handles both _id and id properties
 */
export const getBeatId = (beat) => {
  if (!beat) return null;
  return beat._id || beat.id || null;
};

/**
 * Check if two beats are the same
 * Uses consistent ID comparison
 */
export const isSameBeat = (beat1, beat2) => {
  if (!beat1 || !beat2) return false;
  
  const id1 = getBeatId(beat1);
  const id2 = getBeatId(beat2);
  
  return id1 && id2 && id1 === id2;
};

/**
 * Check if a beat is currently playing
 * Uses the audio context state
 */
export const isBeatPlaying = (beat, audioContext) => {
  const { currentTrack, isPlaying } = audioContext;
  
  if (!isPlaying || !currentTrack || !beat) {
    return false;
  }
  
  return isSameBeat(beat, currentTrack);
};

/**
 * Get audio URL from beat object
 * Handles different property names
 */
export const getBeatAudioUrl = (beat) => {
  if (!beat) return null;
  return beat.audioFile || beat.audioUrl || beat.audio || null;
};

/**
 * Get cover image URL from beat object
 * Handles different property names and fallbacks
 */
export const getBeatCoverImage = (beat, fallback = "/default-cover.jpg") => {
  if (!beat) return fallback;
  return beat.coverImage || beat.imageUrl || beat.image || fallback;
};