// src/context/AudioContext.jsx
import React, { createContext, useState, useRef, useEffect, useContext } from 'react';

// Create the context
const AudioContext = createContext();

// Provider component
export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8); // Start at 80% volume
  const [audioError, setAudioError] = useState(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const audioRef = useRef(new Audio());

  const stopTrack = () => {
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
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
      // Could implement auto-next functionality here
    };

    const handleError = (e) => {
      console.error("Audio error:", e);
      setAudioError(`Error loading audio: ${audio.error?.message || 'Unknown error'}`);
      setIsPlaying(false);
    };

    // Set up event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.volume = volume;

    return () => {
      // Clean up
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update audio source when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current;

    if (currentTrack) {
      // Set loading state
      setAudioError(null);

      // Determine the audio URL
      const audioUrl = currentTrack.audioFile || currentTrack.audioUrl || currentTrack.audio;

      if (audioUrl) {
        // Reset current time
        setCurrentTime(0);

        // Set new source
        audio.src = audioUrl;

        if (isPlaying) {
          audio.play().catch(err => {
            console.error("Error playing audio:", err);
            setIsPlaying(false);
            setAudioError(`Failed to play: ${err.message}`);
          });
        }
      } else {
        setAudioError("No audio URL found for this track");
      }
    }
  }, [currentTrack]);

  // Update when isPlaying changes
  useEffect(() => {
    const audio = audioRef.current;

    if (isPlaying) {
      // Try to play
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
        setAudioError(`Failed to play: ${err.message}`);
      });
    } else {
      // Pause
      audio.pause();
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Control functions
  const playTrack = (track) => {
    if (!audioInitialized) {
      // Initialize audio on first user interaction
      audioRef.current = new Audio();
      setAudioInitialized(true);
    }
    const isSameTrack = currentTrack &&
      ((currentTrack._id && track._id && currentTrack._id === track._id) ||
        (currentTrack.id && track.id && currentTrack.id === track.id));

    if (isSameTrack) {
      // Toggle play/pause for current track
      setIsPlaying(!isPlaying);
    } else {
      // Set new track and play it
      setCurrentTrack(track);
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

  // Additional functions for playlist management
  const playNextTrack = () => {
    // This would need playlist implementation
    console.log("Play next track - feature coming soon");
  };

  const playPreviousTrack = () => {
    // This would need playlist implementation
    console.log("Play previous track - feature coming soon");
  };

  // Make all these functions and state available to components
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
    playNextTrack,
    playPreviousTrack,
    stopTrack
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