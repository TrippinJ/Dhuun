// frontend/src/Components/MiniPlayer.jsx
import React from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { useAudio } from '../context/AudioContext';
import { getBeatId } from '../utils/audioUtils';
import styles from '../css/MiniPlayer.module.css';

const MiniPlayer = ({ beat, showProgress = false }) => {
  const { playTrack, isBeatPlaying, currentTime, duration } = useAudio();
  
  // Use the context's helper function for consistency
  const isThisPlaying = isBeatPlaying(beat);
  
  // Handle play button click
  const handlePlay = (e) => {
    e.stopPropagation(); // Prevent parent click event
    console.log('MiniPlayer play clicked for beat:', getBeatId(beat));
    playTrack(beat);
  };
  
  // Calculate progress percentage
  const progressPercentage = 
    isThisPlaying && duration ? (currentTime / duration) * 100 : 0;
  
  return (
    <div className={styles.miniPlayer}>
      <button 
        className={styles.playButton}
        onClick={handlePlay}
        aria-label={isThisPlaying ? "Pause" : "Play"}
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
        </div>
      )}
    </div>
  );
};

export default MiniPlayer;