// utils/transposedMetadata.js
// Utility functions for calculating transposed audio metadata

// Musical key relationships and progressions
const KEY_PROGRESSIONS = {
  // Major keys
  'C': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  'C#': ['C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C'],
  'D': ['D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#'],
  'D#': ['D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D'],
  'E': ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'],
  'F': ['F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E'],
  'F#': ['F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F'],
  'G': ['G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#'],
  'G#': ['G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G'],
  'A': ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'],
  'A#': ['A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A'],
  'B': ['B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#'],
  
  // Minor keys (using natural minor scale)
  'Am': ['Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'],
  'A#m': ['A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am'],
  'Bm': ['Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m'],
  'Cm': ['Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'],
  'C#m': ['C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm', 'Cm'],
  'Dm': ['Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm', 'Cm', 'C#m'],
  'D#m': ['D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm'],
  'Em': ['Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m'],
  'Fm': ['Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em'],
  'F#m': ['F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm'],
  'Gm': ['Gm', 'G#m', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m'],
  'G#m': ['G#m', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm']
};

// Normalize key names for lookup
const normalizeKey = (key) => {
  if (!key || typeof key !== 'string') return null;
  
  // Handle common variations
  const normalized = key.trim()
    .replace(/♯/g, '#')    // Replace sharp symbol with #
    .replace(/♭/g, 'b')    // Replace flat symbol with b
    .replace(/min/g, 'm')  // Replace "min" with "m"
    .replace(/maj/g, '')   // Remove "maj" 
    .replace(/major/g, '') // Remove "major"
    .replace(/minor/g, 'm'); // Replace "minor" with "m"
  
  return normalized;
};

// Calculate transposed key
const getTransposedKey = (originalKey, semitones) => {
  if (!originalKey || semitones === 0) return originalKey;
  
  const normalizedKey = normalizeKey(originalKey);
  if (!normalizedKey || !KEY_PROGRESSIONS[normalizedKey]) {
    return originalKey; // Return original if we can't transpose
  }
  
  const progression = KEY_PROGRESSIONS[normalizedKey];
  const currentIndex = 0; // Starting position in the progression
  
  // Calculate new index (handle negative values)
  let newIndex = (currentIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  return progression[newIndex];
};

// Calculate transposed BPM (pitch affects perceived tempo)
const getTransposedBPM = (originalBPM, semitones) => {
  if (!originalBPM || semitones === 0) return originalBPM;
  
  // Each semitone changes pitch by factor of 2^(1/12)
  const pitchRatio = Math.pow(2, semitones / 12);
  const transposedBPM = Math.round(originalBPM * pitchRatio);
  
  return transposedBPM;
};

// Calculate transposed duration (inversely related to pitch ratio)
const getTransposedDuration = (originalDuration, semitones) => {
  if (!originalDuration || semitones === 0) return originalDuration;
  
  // Higher pitch = shorter duration, lower pitch = longer duration
  const pitchRatio = Math.pow(2, semitones / 12);
  const transposedDuration = originalDuration / pitchRatio;
  
  return transposedDuration;
};

// Main function to get all transposed metadata
export const getTransposedMetadata = (beat, semitones, originalDuration = null) => {
  if (!beat || semitones === 0) {
    return {
      pitchRatio: 1,
      transposedBPM: beat?.bpm || "N/A",
      transposedKey: beat?.key || "N/A", 
      transposedDuration: originalDuration
    };
  }
  
  // Calculate pitch ratio (used for Web Audio API)
  const pitchRatio = Math.pow(2, semitones / 12);
  
  // Calculate transposed values
  const transposedBPM = getTransposedBPM(beat.bpm, semitones);
  const transposedKey = getTransposedKey(beat.key, semitones);
  const transposedDuration = getTransposedDuration(originalDuration, semitones);
  
  return {
    pitchRatio,
    transposedBPM: transposedBPM || "N/A",
    transposedKey: transposedKey || "N/A",
    transposedDuration
  };
};

// Utility to get semitone name for display
export const getSemitoneName = (semitones) => {
  if (semitones === 0) return "Original";
  if (semitones > 0) return `+${semitones} semitone${semitones === 1 ? '' : 's'}`;
  return `${semitones} semitone${Math.abs(semitones) === 1 ? '' : 's'}`;
};

// Utility to validate transposition range
export const isValidTransposition = (semitones) => {
  return Number.isInteger(semitones) && semitones >= -2 && semitones <= 2;
};