import React, { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import styles from "../css/BeatCard.modules.css";

const BeatCard = ({ beat, onAddToCart, onToggleWishlist, isInWishlist }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle play/pause toggle
  const handlePlayPause = (playing) => {
    setIsPlaying(playing);
  };

  return (
    <div className={styles.card}>
      <img src={beat.coverImage} alt={beat.title} className={styles.coverImage} />
      <h3 className={styles.title}>{beat.title}</h3>
      <p className={styles.artist}>
        {beat.producer?.name || beat.artist} 
        {beat.producer?.verified && <span className={styles.verified}>✔</span>}
      </p>
      <div className={styles.priceTag}>${beat.price.toFixed(2)}</div>
      
      {/* Audio Player Component */}
      <AudioPlayer 
        audioUrl={beat.audioFile || beat.audioUrl}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        size="medium"
      />
      
      <div className={styles.beatActions}>
        <button 
          className={styles.buyBtn}
          onClick={() => onAddToCart(beat)}
        >
          Add to Cart
        </button>
        
        <button 
          className={`${styles.wishlistBtn} ${isInWishlist ? styles.inWishlist : ''}`}
          onClick={() => onToggleWishlist(beat)}
        >
          {isInWishlist ? '❤️' : '♡'}
        </button>
      </div>
    </div>
  );
};

export default BeatCard;