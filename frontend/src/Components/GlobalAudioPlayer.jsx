// src/components/GlobalAudioPlayer.jsx
import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import styles from '../css/GlobalAudioPlayer.module.css';

const GlobalAudioPlayer = () => {
  const { 
    currentTrack, 
    isPlaying, 
    duration, 
    currentTime, 
    volume,
    playTrack, 
    pauseTrack, 
    seekTo,
    changeVolume 
  } = useAudio();
  
  const [showVolume, setShowVolume] = useState(false);

  // Handle play/pause button click
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  };

  // Format time (e.g. 3:45)
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Only show the player if there's a track
  if (!currentTrack) {
    return null;
  }

  return (
    <div className={styles.playerContainer}>
      <div className={styles.trackInfo}>
        <img 
          src={currentTrack.coverImage || '/default-cover.jpg'} 
          alt={currentTrack.title}
          className={styles.trackCover}
        />
        <div className={styles.trackText}>
          <h3>{currentTrack.title}</h3>
          <p>{currentTrack.producer?.name || 'Unknown Producer'}</p>
        </div>
      </div>
      
      <div className={styles.controls}>
        <button 
          className={styles.playButton}
          onClick={handlePlayPause}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        
        <div className={styles.progressContainer}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seekTo(parseFloat(e.target.value))}
            className={styles.progressBar}
          />
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>
      </div>
      
      <div className={styles.volumeContainer}>
        <button 
          className={styles.volumeButton}
          onClick={() => setShowVolume(!showVolume)}
        >
          {volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
        </button>
        
        {showVolume && (
          <div className={styles.volumeSlider}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => changeVolume(e.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;