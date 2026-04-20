import React, { useState, useRef, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';
import { useLicense } from '../context/LicenseContext';
import { useWishlist } from '../context/WishlistContext';
import { useNavigate } from 'react-router-dom';
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute,
  FaForward, FaBackward, FaHeart, FaEllipsisH,
  FaShoppingCart, FaTimes
} from 'react-icons/fa';
import { getBeatId } from '../utils/audioUtils';
import { toast } from '../utils/toast';          // ← replaces all alert() calls
import styles from '../css/GlobalAudioPlayer.module.css';

const GlobalAudioPlayer = () => {
  const {
    currentTrack, isPlaying, duration, currentTime,
    volume, autoPlayEnabled,
    playTrack, pauseTrack, seekTo, changeVolume,
    stopTrack, playRandomTrack, toggleAutoPlay,
  } = useAudio();

  const { openLicenseModal } = useLicense();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [showVolume,  setShowVolume]  = useState(false);
  const [isMuted,     setIsMuted]     = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const previousVolume = useRef(volume);
  const progressBarRef = useRef(null);

  const isLiked = currentTrack ? isInWishlist(currentTrack) : false;

  // ── Space bar play/pause ─────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!currentTrack || e.code !== 'Space') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      handlePlayPause();
    };

    if (currentTrack) document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentTrack, isPlaying]);

  // Hide player when no track
  if (!currentTrack) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    return `${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, '0')}`;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    isPlaying ? pauseTrack() : playTrack(currentTrack);
  };

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

  const handleLikeToggle = () => {
    if (!currentTrack) return;
    const result = toggleWishlist(currentTrack);
    if (result.success) {
      // Wishlist context already updates the heart icon — just confirm with toast
      result.added
        ? toast.success('Added to favourites')
        : toast.info('Removed from favourites');
    }
  };

  const handleProgressClick = (e) => {
    const bar = progressBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    seekTo(duration * ((e.clientX - rect.left) / rect.width));
  };

  // ── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    const isLoggedIn = localStorage.getItem('token');

    if (!isLoggedIn) {
      // toast.loginRequired opens /login on click — no blocking alert()
      toast.loginRequired(navigate, 'Log in to add beats to your cart');
      return;
    }

    openLicenseModal(currentTrack, (beatWithLicense) => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');

        const alreadyInCart = cart.some(
          item =>
            getBeatId(item) === getBeatId(beatWithLicense) &&
            item.selectedLicense === beatWithLicense.selectedLicense
        );

        if (alreadyInCart) {
          // Warn — not an error, just informative
          toast.cartDuplicate(beatWithLicense.title, beatWithLicense.licenseName);
          return;
        }

        cart.push(beatWithLicense);
        localStorage.setItem('cart', JSON.stringify(cart));

        // Branded cart confirmation
        toast.cartAdd(beatWithLicense.title, beatWithLicense.licenseName);

      } catch (err) {
        console.error('Error adding to cart:', err);
        toast.error('Could not add to cart — please try again');
      }
    });
  };

  // ── Navigation helpers ───────────────────────────────────────────────────
  const goToTrack = () => {
    sessionStorage.setItem('openBeatModal', getBeatId(currentTrack));
    navigate('/BeatExplorePage');
    setShowOptions(false);
  };

  const goToArtist = () => {
    sessionStorage.setItem(
      'openProducerProfile',
      currentTrack.producer?._id || currentTrack.producer?.id
    );
    navigate('/BeatExplorePage');
    setShowOptions(false);
  };

  const handleClose    = () => stopTrack();
  const handlePrevious = () => playRandomTrack();
  const handleNext     = () => playRandomTrack();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={styles.playerContainer}>
      <div className={styles.playerContent}>

        {/* Track info */}
        <div className={styles.trackInfo}>
          <img
            src={currentTrack.coverImage || '/default-cover.jpg'}
            alt={currentTrack.title}
            className={styles.trackCover}
            onError={e => { e.target.src = '/default-cover.jpg'; }}
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
              {autoPlayEnabled && (
                <span className={styles.autoPlayIndicator}> • Auto-play</span>
              )}
            </div>
          </div>
        </div>

        {/* Centre controls */}
        <div className={styles.centerControls}>
          <div className={styles.controlButtons}>
            <button className={styles.controlButton} onClick={handlePrevious} aria-label="Previous track">
              <FaBackward />
            </button>
            <button className={styles.playButton} onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button className={styles.controlButton} onClick={handleNext} aria-label="Next track">
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
                />
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
            aria-label={isLiked ? 'Remove from favourites' : 'Add to favourites'}
          >
            <FaHeart />
          </button>

          <div className={styles.volumeControl}>
            <button
              className={styles.volumeButton}
              onClick={handleMuteToggle}
              onMouseEnter={() => setShowVolume(true)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            </button>
            {showVolume && (
              <div className={styles.volumeSlider} onMouseLeave={() => setShowVolume(false)}>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={volume}
                  onChange={e => changeVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                />
              </div>
            )}
          </div>

          <div className={styles.optionsMenu}>
            <button
              className={styles.menuButton}
              onClick={() => setShowOptions(prev => !prev)}
              aria-label="More options"
            >
              <FaEllipsisH />
            </button>
            {showOptions && (
              <div className={styles.menuDropdown}>
                <ul>
                  <li onClick={() => { toggleAutoPlay(); setShowOptions(false); }}>
                    {autoPlayEnabled ? 'Disable' : 'Enable'} Auto-play
                  </li>
                  <li onClick={() => { navigate('/favorites'); setShowOptions(false); }}>
                    Add to Playlist
                  </li>
                  <li onClick={goToTrack}>Go to Track</li>
                  <li onClick={goToArtist}>Go to Artist</li>
                </ul>
              </div>
            )}
          </div>

          <button className={styles.buyButton} onClick={handleAddToCart}>
            <FaShoppingCart className={styles.cartIcon} />
            Rs {currentTrack.price?.toFixed(2) || '0.00'}
          </button>

          <button className={styles.closeButton} onClick={handleClose} aria-label="Close player">
            <FaTimes />
          </button>
        </div>

      </div>
    </div>
  );
};

export default GlobalAudioPlayer;