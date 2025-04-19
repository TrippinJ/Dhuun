// src/components/MiniPlayer.jsx
import React from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { useAudio } from '../context/AudioContext';
import styles from '../css/MiniPlayer.module.css';

const MiniPlayer = ({ beat, showProgress = false }) => {
  const { currentTrack, isPlaying, currentTime, duration, playTrack } = useAudio();
  
  // Check if this beat is currently playing
  const isThisPlaying = 
    isPlaying && 
    currentTrack && 
    (currentTrack.id === beat.id || currentTrack._id === beat._id);
  
  // Handle play button click
  const handlePlay = (e) => {
    e.stopPropagation(); // Prevent parent click event
    playTrack(beat);
  };
  
  // Format time (e.g. 3:45)
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  // Calculate progress percentage
  const progressPercentage = 
    isThisPlaying && duration ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className={styles.miniPlayer}>
      <button 
        className={styles.playButton}
        onClick={handlePlay}
      >
        {isThisPlaying ? <FaPause /> : <FaPlay />}
      </button>
      
      {showProgress && (
        <div className={styles.progressContainer}>
          <div className={styles.progressTrack}>
            <div 
              className={styles.progressBar}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          {isThisPlaying && (
            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MiniPlayer;