// src/context/AudioContext.jsx
import React, { createContext, useState, useRef, useContext, useEffect } from 'react';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef(new Audio());

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    // Set volume
    audio.volume = volume;

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume]);

  // Play a track
  const playTrack = (track) => {
    const audio = audioRef.current;

    // If selecting the same track that's already playing
    if (currentTrack && currentTrack._id === track._id) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play()
          .catch(error => console.error("Error playing audio:", error));
        setIsPlaying(true);
      }
      return;
    }

    // Handle a new track
    audio.pause();
    setCurrentTrack(track);
    setIsPlaying(false);
    setCurrentTime(0);
    
    // Set new audio source
    const audioUrl = track.audioFile || track.audioUrl;
    if (!audioUrl) {
      console.error("No audio URL found for this track");
      return;
    }
    
    audio.src = audioUrl;
    
    // Play the track
    audio.load();
    audio.play()
      .then(() => {
        setIsPlaying(true);
        
        // Try to increment play count via API if available
        const trackId = track._id || track.id;
        if (trackId) {
          try {
            fetch(`/api/beats/${trackId}/play`, { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            }).catch(err => {
              console.log("Could not update play count");
            });
          } catch (e) {
            // Silently ignore tracking errors
          }
        }
      })
      .catch(error => {
        console.error("Error playing audio:", error);
      });
  };

  // Pause current track
  const pauseTrack = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  // Seek to a specific time
  const seekTo = (time) => {
    if (audioRef.current.src) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Change volume
  const changeVolume = (value) => {
    const newVolume = parseFloat(value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const value = {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    playTrack,
    pauseTrack,
    seekTo,
    changeVolume,
  };


  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );;
};

// Custom hook to use the audio context
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};