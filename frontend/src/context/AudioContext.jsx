// frontend/src/context/AudioContext.jsx
import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { getBeatId, getBeatAudioUrl } from '../utils/audioUtils';

// Create the context
const AudioContext = createContext();

// Provider component
export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioError, setAudioError] = useState(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const audioRef = useRef(new Audio());

  // Normalize beat object to ensure consistent ID format
  const normalizeBeat = (beat) => {
    if (!beat) return null;
    
    return {
      ...beat,
      // Ensure we always have an id property for consistency
      id: getBeatId(beat),
      audioUrl: getBeatAudioUrl(beat)
    };
  };

  const stopTrack = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioError(null);
  };

  // Set up audio element
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setAudioError(null);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      console.error("Audio error:", e);
      setAudioError(`Error loading audio: ${audio.error?.message || 'Unknown error'}`);
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      setAudioError(null);
    };

    // Set up event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.volume = volume;

    return () => {
      // Clean up
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);

      audio.pause();
      audio.src = '';
    };
  }, [volume]);

  // Update audio source when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;

    if (currentTrack) {
      const audioUrl = currentTrack.audioUrl || getBeatAudioUrl(currentTrack);

      if (audioUrl && audioUrl !== audio.src) {
        setAudioError(null);
        setCurrentTime(0);
        
        // Set new source
        audio.src = audioUrl;
        audio.load();

        if (isPlaying) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.error("Error playing audio:", err);
              setIsPlaying(false);
              setAudioError(`Failed to play: ${err.message}`);
            });
          }
        }
      }
    } else {
      // No current track, clear audio
      audio.src = '';
      setDuration(0);
      setCurrentTime(0);
    }
  }, [currentTrack, isPlaying]);

  // Handle volume changes
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Control functions
  const playTrack = (track) => {
    if (!audioInitialized) {
      setAudioInitialized(true);
    }

    const normalizedTrack = normalizeBeat(track);
    const isSameTrack = currentTrack && normalizedTrack && 
      getBeatId(currentTrack) === getBeatId(normalizedTrack);

    console.log('PlayTrack called:', {
      newTrack: getBeatId(normalizedTrack),
      currentTrack: getBeatId(currentTrack),
      isSameTrack,
      isPlaying
    });

    if (isSameTrack) {
      // Toggle play/pause for current track
      setIsPlaying(!isPlaying);
    } else {
      // Set new track and play it
      setCurrentTrack(normalizedTrack);
      setIsPlaying(true);
    }
  };

  const pauseTrack = () => {
    setIsPlaying(false);
  };

  const seekTo = (time) => {
    if (time >= 0 && time <= duration) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changeVolume = (value) => {
    const newVolume = parseFloat(value);
    if (newVolume >= 0 && newVolume <= 1) {
      setVolume(newVolume);
    }
  };

  // Helper function to check if a specific beat is playing
  const isBeatPlaying = (beat) => {
    if (!isPlaying || !currentTrack || !beat) {
      return false;
    }
    
    const currentId = getBeatId(currentTrack);
    const beatId = getBeatId(beat);
    
    return currentId && beatId && currentId === beatId;
  };

  const value = {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    audioError,
    playTrack,
    pauseTrack,
    seekTo,
    changeVolume,
    stopTrack,
    isBeatPlaying // Add this helper function
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};

// Custom hook to use the audio context
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};