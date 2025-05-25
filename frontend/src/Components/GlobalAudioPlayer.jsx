import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { useLicense } from '../context/LicenseContext';
import { useWishlist } from '../context/WishlistContext';
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
import { getBeatId } from '../utils/audioUtils';
import styles from '../css/GlobalAudioPlayer.module.css';

const GlobalAudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    duration,
    currentTime,
    volume,
    autoPlayEnabled,
    playTrack,
    pauseTrack,
    seekTo,
    changeVolume,
    stopTrack,
    playRandomTrack,
    toggleAutoPlay
  } = useAudio();

  const { openLicenseModal } = useLicense();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [showVolume, setShowVolume] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const previousVolume = useRef(volume);
  const progressBarRef = useRef(null);

  // Check if current track is in wishlist
  const isLiked = currentTrack ? isInWishlist(currentTrack) : false;

  // Space bar functionality - only when player is visible
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only work when player is visible and currentTrack exists
      if (currentTrack && e.code === 'Space') {
        // Prevent default behavior (page scroll)
        e.preventDefault();
        
        // Don't trigger if user is typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          return;
        }
        
        handlePlayPause();
      }
    };

    // Add event listener when player is visible
    if (currentTrack) {
      document.addEventListener('keydown', handleKeyPress);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentTrack, isPlaying]);

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

  // Handle like toggle using wishlist context
  const handleLikeToggle = () => {
    if (!currentTrack) return;

    const result = toggleWishlist(currentTrack);
    if (result.success && result.message) {
      // Optional: Show a toast notification instead of alert
      // For now, we'll keep it simple without alerts since the heart icon updates immediately
      console.log(result.message);
    }
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

  // Enhanced add to cart with license selection
  const handleAddToCart = () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    // Open license modal with callback
    openLicenseModal(currentTrack, (beatWithLicense) => {
      try {
        // Get existing cart
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Check if already in cart with same license
        const isInCart = cart.some(item => 
          getBeatId(item) === getBeatId(beatWithLicense) &&
          item.selectedLicense === beatWithLicense.selectedLicense
        );

        if (isInCart) {
          alert(`"${beatWithLicense.title}" with ${beatWithLicense.licenseName} is already in your cart`);
          return;
        }
        
        // Add to cart
        cart.push(beatWithLicense);
        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`${beatWithLicense.title} with ${beatWithLicense.licenseName} added to cart!`);
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Error adding to cart. Please try again.");
      }
    });
  };

  // Handle navigate to track page - redirect to BeatExplorePage and trigger modal
  const goToTrack = () => {
    // Store the beat ID to open modal on BeatExplorePage
    sessionStorage.setItem('openBeatModal', getBeatId(currentTrack));
    navigate('/BeatExplorePage');
    setShowOptions(false);
  };

  // Handle navigate to artist page - redirect to BeatExplorePage and trigger producer profile
  const goToArtist = () => {
    // Store the producer ID to open producer profile on BeatExplorePage
    sessionStorage.setItem('openProducerProfile', currentTrack.producer?._id || currentTrack.producer?.id);
    navigate('/BeatExplorePage');
    setShowOptions(false);
  };

  // Handle close/stop button click
  const handleClose = () => {
    stopTrack();
  };

  // Handle previous track (random for now)
  const handlePrevious = () => {
    playRandomTrack();
  };

  // Handle next track (random for now)
  const handleNext = () => {
    playRandomTrack();
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
              <p className={styles.trackArtist}>
                {currentTrack.producer?.name || currentTrack.artist || 'Unknown Producer'}
              </p>
            </div>
            <div className={styles.bpmInfo}>
              {currentTrack.bpm && `${currentTrack.bpm} BPM`}
              {autoPlayEnabled && <span className={styles.autoPlayIndicator}> • Auto-play</span>}
            </div>
          </div>
        </div>

        {/* Center controls */}
        <div className={styles.centerControls}>
          <div className={styles.controlButtons}>
            <button 
              className={styles.controlButton} 
              onClick={handlePrevious}
              aria-label="Previous track"
            >
              <FaBackward />
            </button>

            <button
              className={styles.playButton}
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>

            <button 
              className={styles.controlButton} 
              onClick={handleNext}
              aria-label="Next track"
            >
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
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
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
                    toggleAutoPlay();
                    setShowOptions(false);
                  }}>
                    {autoPlayEnabled ? 'Disable' : 'Enable'} Auto-play
                  </li>
                  <li onClick={() => {
                    navigate('/favorites');
                    setShowOptions(false);
                  }}>Add to Playlist</li>
                  <li onClick={goToTrack}>Go to Track</li>
                  <li onClick={goToArtist}>Go to Artist</li>
                </ul>
              </div>
            )}
          </div>

          {/* Enhanced Buy button with license selection */}
          <button
            className={styles.buyButton}
            onClick={handleAddToCart}
          >
            <FaShoppingCart className={styles.cartIcon} />
            Rs {currentTrack.price?.toFixed(2) || "0.00"}
          </button>

          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close player"
          >
            <FaTimes />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;