
import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute, 
  FaForward, 
  FaBackward, 
  FaHeart, 
  FaEllipsisH,
  FaShoppingCart,
  FaTimes
} from 'react-icons/fa';
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
    changeVolume,
    stopTrack
  } = useAudio();
  
  const [showVolume, setShowVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const previousVolume = useRef(volume);
  const progressBarRef = useRef(null);
  const navigate = useNavigate();
  
  // Check if beat is in wishlist
  useEffect(() => {
    if (currentTrack) {
      try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const liked = wishlist.some(item => 
          item._id === currentTrack._id || item.id === currentTrack.id
        );
        setIsLiked(liked);
      } catch (error) {
        console.error("Error parsing wishlist:", error);
      }
    }
  }, [currentTrack]);

  // Only show the player if there's a track
  if (!currentTrack) {
    return null;
  }

  // Format time (e.g. 1:59)
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Handle play/pause button click
  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  };

  // Handle mute/unmute
  const handleMuteToggle = () => {
    if (isMuted) {
      changeVolume(previousVolume.current);
      setIsMuted(false);
    } else {
      previousVolume.current = volume;
      changeVolume(0);
      setIsMuted(true);
    }
  };

  // Handle like toggle
  const handleLikeToggle = () => {
    let wishlist = [];
    try {
      wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    } catch (error) {
      console.error("Error parsing wishlist:", error);
    }
    
    const index = wishlist.findIndex(item => 
      item._id === currentTrack._id || item.id === currentTrack.id
    );
    
    if (index !== -1) {
      // Remove from wishlist
      wishlist.splice(index, 1);
      setIsLiked(false);
    } else {
      // Add to wishlist
      wishlist.push(currentTrack);
      setIsLiked(true);
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  };

  // Handle progress bar click for seeking
  const handleProgressClick = (e) => {
    const progressBar = progressBarRef.current;
    if (progressBar && duration) {
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const seekTime = duration * clickPosition;
      seekTo(seekTime);
    }
  };

  // Handle adding to cart
  const handleAddToCart = () => {
    // Get existing cart or initialize empty array
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (error) {
      console.error("Error parsing cart:", error);
    }
    
    // Check if beat is already in cart
    const beatInCart = cart.some(item => 
      item._id === currentTrack._id || item.id === currentTrack.id
    );
    
    if (beatInCart) {
      alert(`"${currentTrack.title}" is already in your cart`);
      return;
    }
    
    // Add beat to cart
    cart.push(currentTrack);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show feedback to user
    alert(`${currentTrack.title} added to cart!`);
  };

  // Handle navigate to track page
  const goToTrack = () => {
    navigate(`/beat/${currentTrack._id || currentTrack.id}`);
    setShowOptions(false);
  };

  // Handle navigate to artist page
  const goToArtist = () => {
    navigate(`/producer/${currentTrack.producer?._id || currentTrack.producer?.id}`);
    setShowOptions(false);
  };

  if (!currentTrack) {
    return null;
  }

  // Handle close/stop button click
  const handleClose = () => {
    stopTrack();
  };

  return (
    <div className={styles.playerContainer}>
      <div className={styles.playerContent}>
        {/* Track info */}
        <div className={styles.trackInfo}>
          <img 
            src={currentTrack.coverImage || '/default-cover.jpg'} 
            alt={currentTrack.title}
            className={styles.trackCover}
            onError={(e) => {
              e.target.src = "/default-cover.jpg";
            }}
          />
          <div className={styles.trackDetails}>
            <div className={styles.trackText}>
              <h3 className={styles.trackTitle}>{currentTrack.title}</h3>
              <p className={styles.trackArtist}>{currentTrack.producer?.name || currentTrack.artist || 'Unknown Producer'}</p>
            </div>
            <div className={styles.bpmInfo}>
              {currentTrack.bpm && `${currentTrack.bpm} BPM`}
            </div>
          </div>
        </div>
        
        {/* Center controls */}
        <div className={styles.centerControls}>
          <div className={styles.controlButtons}>
            <button className={styles.controlButton} aria-label="Previous track">
              <FaBackward />
            </button>
            
            <button 
              className={styles.playButton}
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            
            <button className={styles.controlButton} aria-label="Next track">
              <FaForward />
            </button>
          </div>
          
          <div className={styles.timeInfo}>
            <span className={styles.currentTime}>{formatTime(currentTime)}</span>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar}
                ref={progressBarRef}
                onClick={handleProgressClick}
              >
                <div 
                  className={styles.progressFill}
                  style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
            <span className={styles.duration}>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Right actions */}
        <div className={styles.rightControls}>
          <button 
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={handleLikeToggle}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
          >
            <FaHeart />
          </button>
          
          <div className={styles.volumeControl}>
            <button 
              className={styles.volumeButton}
              onClick={handleMuteToggle}
              onMouseEnter={() => setShowVolume(true)}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            
            {showVolume && (
              <div 
                className={styles.volumeSlider}
                onMouseLeave={() => setShowVolume(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => changeVolume(e.target.value)}
                  aria-label="Volume"
                />
              </div>
            )}
          </div>
          
          <div className={styles.optionsMenu}>
            <button 
              className={styles.menuButton}
              onClick={() => setShowOptions(!showOptions)}
              aria-label="More options"
            >
              <FaEllipsisH />
            </button>
            
            {showOptions && (
              <div className={styles.menuDropdown}>
                <ul>
                  <li onClick={() => {
                    navigate('/favorites');
                    setShowOptions(false);
                  }}>Add to Playlist</li>
                  <li onClick={goToTrack}>Go to Track</li>
                  <li onClick={goToArtist}>Go to Artist</li>
                  <li onClick={() => {
                    // Share functionality could be implemented here
                    alert('Share functionality coming soon!');
                    setShowOptions(false);
                  }}>Share</li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Buy button */}
          <button 
            className={styles.buyButton}
            onClick={handleAddToCart}
          >
            <FaShoppingCart className={styles.cartIcon} />
            ${currentTrack.price?.toFixed(2) || "0.00"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;