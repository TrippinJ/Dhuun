
import React from "react";
import { FaPlay, FaPause, FaShoppingCart, FaHeart } from "react-icons/fa";
import { useAudio } from '../context/AudioContext';
import styles from "../css/BeatCard.module.css";

const BeatCard = ({ beat }) => {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  
  // Check if this beat is currently playing
  const isThisPlaying = 
    isPlaying && 
    currentTrack && 
    (currentTrack.id === beat.id || currentTrack._id === beat._id);
  
  // Handle play button click
  const handlePlay = (e) => {
    e.stopPropagation(); // Prevent card click if applicable
    playTrack(beat);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img 
          src={beat.coverImage || "/default-cover.jpg"}
          alt={beat.title}
          className={styles.beatImage}
        />
        <div className={styles.imageOverlay}>
          <button 
            className={styles.playButton}
            onClick={handlePlay}
          >
            {isThisPlaying ? <FaPause /> : <FaPlay />}
          </button>
        </div>
      </div>
      
      <div className={styles.beatInfo}>
        <h3 className={styles.beatTitle}>{beat.title}</h3>
        <p className={styles.beatProducer}>
          {beat.producer?.name || "Unknown Producer"}
        </p>
        <div className={styles.beatFooter}>
          <span className={styles.beatPrice}>${beat.price?.toFixed(2) || "0.00"}</span>
          <div className={styles.beatActions}>
            <button className={styles.cartButton}>
              <FaShoppingCart />
            </button>
            <button className={styles.favoriteButton}>
              <FaHeart />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeatCard;