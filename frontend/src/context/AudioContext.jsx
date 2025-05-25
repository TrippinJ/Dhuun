// frontend/src/context/AudioContext.jsx
import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { getBeatId, getBeatAudioUrl } from '../utils/audioUtils';
import API from '../api/api';

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

  // New state for random track functionality
  const [availableBeats, setAvailableBeats] = useState([]);
  const [isLoadingBeats, setIsLoadingBeats] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);

  const audioRef = useRef(new Audio());

  // Fetch all available beats for random selection
  const fetchAvailableBeats = async () => {
    if (isLoadingBeats || availableBeats.length > 0) return; // Prevent multiple calls

    try {
      setIsLoadingBeats(true);
      console.log('Fetching all available beats for random selection...');

      const response = await API.get('/api/beats');
      let beats = [];

      if (response.data && response.data.data) {
        beats = response.data.data;
      } else if (Array.isArray(response.data)) {
        beats = response.data;
      }

      // Filter out exclusively sold beats and ensure they have audio
      const validBeats = beats.filter(beat =>
        !beat.isExclusiveSold &&
        getBeatAudioUrl(beat) &&
        beat.title
      );

      setAvailableBeats(validBeats);
      console.log(`Loaded ${validBeats.length} beats for random selection`);

    } catch (error) {
      console.error('Error fetching beats for random selection:', error);

      // Fallback beats for development
      const fallbackBeats = [
        {
          _id: "sample1",
          title: "Summer Vibes",
          producer: { name: "DJ Beats", verified: true },
          genre: "Trap",
          coverImage: "/default-cover.jpg",
          audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          price: 19.99,
          plays: 1200,
          likes: 356
        },
        {
          _id: "sample2",
          title: "Midnight Feels",
          producer: { name: "Beat Master", verified: false },
          genre: "Hip-Hop",
          coverImage: "/default-cover.jpg",
          audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          price: 24.99,
          plays: 820,
          likes: 215
        },
        {
          _id: "sample3",
          title: "Cloudy Dreams",
          producer: { name: "Cloud Beatz", verified: true },
          genre: "Lo-Fi",
          coverImage: "/default-cover.jpg",
          audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          price: 14.99,
          plays: 650,
          likes: 120
        }
      ];

      setAvailableBeats(fallbackBeats);
    } finally {
      setIsLoadingBeats(false);
    }
  };

  // Load beats when component mounts
  useEffect(() => {
    fetchAvailableBeats();
  }, []);

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

  // Get a random beat from available beats (excluding current track)
  const getRandomBeat = () => {
    if (availableBeats.length === 0) {
      console.log('No available beats for random selection');
      return null;
    }

    // Filter out current track to avoid repeating
    const availableForRandom = availableBeats.filter(beat => {
      if (!currentTrack) return true;
      return getBeatId(beat) !== getBeatId(currentTrack);
    });

    if (availableForRandom.length === 0) {
      // If all beats are filtered out, use all available beats
      availableForRandom.push(...availableBeats);
    }

    const randomIndex = Math.floor(Math.random() * availableForRandom.length);
    const selectedBeat = availableForRandom[randomIndex];

    console.log(`Selected random beat: ${selectedBeat.title} by ${selectedBeat.producer?.name}`);
    return selectedBeat;
  };

  // Play a random track
  const playRandomTrack = () => {
    console.log('playRandomTrack called');

    if (availableBeats.length === 0) {
      console.log('No beats available for random play, fetching...');
      fetchAvailableBeats().then(() => {
        const randomBeat = getRandomBeat();
        if (randomBeat) {
          playTrack(randomBeat);
        }
      });
      return;
    }

    const randomBeat = getRandomBeat();
    if (randomBeat) {
      playTrack(randomBeat);
    } else {
      console.log('Could not select a random beat');
    }
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
      console.log('Track ended, isAutoPlayEnabled:', autoPlayEnabled);
      setIsPlaying(false);
      setCurrentTime(0);

      // Auto-play next random track if enabled
      if (autoPlayEnabled) {
        console.log('Auto-playing next track...');
        // Small delay before playing next track
        setTimeout(() => {
          playRandomTrack();
        }, 1500); // 1.5 second delay between tracks
      }
    };

    const handleError = (e) => {
      console.error("Audio error:", e);
      setAudioError(`Error loading audio: ${audio.error?.message || 'Unknown error'}`);
      setIsPlaying(false);

      // If auto-play is enabled and we get an error, try next track
      if (autoPlayEnabled) {
        console.log('Audio error occurred, trying next track...');
        setTimeout(() => {
          playRandomTrack();
        }, 2000);
      }
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
  }, [volume, autoPlayEnabled]); // Added autoPlayEnabled to dependencies

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

              // If auto-play is enabled and playback fails, try next track
              if (autoPlayEnabled) {
                setTimeout(() => {
                  playRandomTrack();
                }, 2000);
              }
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
  }, [currentTrack, isPlaying, autoPlayEnabled]);

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

    const audio = audioRef.current;

    console.log('PlayTrack called:', {
      newTrack: getBeatId(normalizedTrack),
      currentTrack: getBeatId(currentTrack),
      isSameTrack,
      isPlaying
    });

    if (isSameTrack) {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  } else {
    setCurrentTrack(normalizedTrack);
    setIsPlaying(true);
  }
};

  const pauseTrack = () => {
    const audio = audioRef.current;
    audio.pause();
    setIsPlaying(false);
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

  // Toggle auto-play functionality
  const toggleAutoPlay = () => {
    const newAutoPlayState = !autoPlayEnabled;
    setAutoPlayEnabled(newAutoPlayState);
    console.log(`Auto-play ${newAutoPlayState ? 'enabled' : 'disabled'}`);

    // Store preference in localStorage
    localStorage.setItem('audioAutoPlay', JSON.stringify(newAutoPlayState));

    return newAutoPlayState;
  };

  // Load auto-play preference from localStorage
  useEffect(() => {
    try {
      const savedAutoPlay = localStorage.getItem('audioAutoPlay');
      if (savedAutoPlay !== null) {
        setAutoPlayEnabled(JSON.parse(savedAutoPlay));
      }
    } catch (error) {
      console.error('Error loading auto-play preference:', error);
    }
  }, []);

  // Helper function to check if a specific beat is playing
  const isBeatPlaying = (beat) => {
    if (!isPlaying || !currentTrack || !beat) {
      return false;
    }

    const currentId = getBeatId(currentTrack);
    const beatId = getBeatId(beat);

    return currentId && beatId && currentId === beatId;
  };

  // Refresh available beats (useful if new beats are added)
  const refreshAvailableBeats = () => {
    setAvailableBeats([]);
    setIsLoadingBeats(false);
    fetchAvailableBeats();
  };

  const value = {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    audioError,
    autoPlayEnabled,
    availableBeats,
    isLoadingBeats,
    playTrack,
    pauseTrack,
    seekTo,
    changeVolume,
    stopTrack,
    playRandomTrack,
    toggleAutoPlay,
    refreshAvailableBeats,
    isBeatPlaying
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