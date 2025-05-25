// frontend/src/context/AudioContext.jsx
import React, { createContext, useState, useRef, useEffect, useContext } from 'react';
import { getBeatId, getBeatAudioUrl } from '../utils/audioUtils';
import API from '../api/api';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioError, setAudioError] = useState(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  const [availableBeats, setAvailableBeats] = useState([]);
  const [isLoadingBeats, setIsLoadingBeats] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);

  const audioRef = useRef(new Audio());

  const fetchAvailableBeats = async () => {
    if (isLoadingBeats || availableBeats.length > 0) return;
    try {
      setIsLoadingBeats(true);
      const response = await API.get('/api/beats');
      let beats = response.data?.data || response.data || [];
      const validBeats = beats.filter(beat =>
        !beat.isExclusiveSold && getBeatAudioUrl(beat) && beat.title
      );
      setAvailableBeats(validBeats);
    } catch (error) {
      console.error('Error fetching beats:', error);
    } finally {
      setIsLoadingBeats(false);
    }
  };

  useEffect(() => {
    fetchAvailableBeats();
  }, []);

  const normalizeBeat = (beat) => {
    if (!beat) return null;
    return {
      ...beat,
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

  const getRandomBeat = () => {
    const pool = availableBeats.filter(beat =>
      !currentTrack || getBeatId(beat) !== getBeatId(currentTrack)
    );
    const targetPool = pool.length ? pool : availableBeats;
    const randomIndex = Math.floor(Math.random() * targetPool.length);
    return targetPool[randomIndex];
  };

  const playRandomTrack = () => {
    const beat = getRandomBeat();
    if (beat) playTrack(beat, true); // force autoplay on same track
  };

  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (autoPlayEnabled) setTimeout(playRandomTrack, 1500);
    };
    const handleError = () => {
      setAudioError("Error loading audio");
      setIsPlaying(false);
      if (autoPlayEnabled) setTimeout(playRandomTrack, 2000);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!currentTrack) {
      audio.src = '';
      setDuration(0);
      setCurrentTime(0);
      return;
    }
    const audioUrl = currentTrack.audioUrl || getBeatAudioUrl(currentTrack);
    if (audioUrl && !audio.src.includes(audioUrl)) {
      setAudioError(null);
      setCurrentTime(0);
      audio.src = audioUrl;
      audio.load();
      if (isPlaying) {
        setTimeout(() => {
          audio.play().catch(err => {
            console.error("Error playing audio:", err);
            setIsPlaying(false);
            setAudioError(`Failed to play: ${err.message}`);
            if (autoPlayEnabled) setTimeout(playRandomTrack, 2000);
          });
        }, 100);
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio.src) return;
    if (isPlaying) {
      audio.play().catch(err => {
        console.error("Playback error:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const playTrack = (track, forcePlay = false) => {
    if (!audioInitialized) setAudioInitialized(true);
    const normalized = normalizeBeat(track);
    const isSame = currentTrack && normalized && getBeatId(currentTrack) === getBeatId(normalized);
    if (isSame && !forcePlay) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(null);
      setTimeout(() => {
        setCurrentTrack(normalized);
        setIsPlaying(true);
      }, 50);
    }
  };

  const pauseTrack = () => {
    audioRef.current.pause();
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

  const toggleAutoPlay = () => {
    const newState = !autoPlayEnabled;
    setAutoPlayEnabled(newState);
    localStorage.setItem('audioAutoPlay', JSON.stringify(newState));
    return newState;
  };

  useEffect(() => {
    const saved = localStorage.getItem('audioAutoPlay');
    if (saved !== null) setAutoPlayEnabled(JSON.parse(saved));
  }, []);

  const isBeatPlaying = (beat) => {
    return isPlaying && currentTrack && beat && getBeatId(currentTrack) === getBeatId(beat);
  };

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

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within an AudioProvider');
  return context;
};
