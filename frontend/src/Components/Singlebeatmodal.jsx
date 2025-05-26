import React, { useState, useEffect, useMemo } from 'react';
import { useLicense } from '../context/LicenseContext';
import { useWishlist } from '../context/WishlistContext';
import { useAudio } from '../context/AudioContext';
import styles from '../css/SingleBeatModal.module.css';
import {
  FaPlay,
  FaPause,
  FaCartPlus,
  FaHeart,
  FaTimes,
  FaMusic,
  FaClock,
  FaCalendarAlt,
  FaHashtag,
  FaPlus,
  FaMinus
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { getTransposedMetadata } from '../utils/transposedMetadata';

const SingleBeatModal = ({
  beat,
  isOpen,
  onClose,
  onAddToCart,
  isInCart,
  isLoading
}) => {
  const [semitones, setSemitones] = useState(0);
  const [showLicenseDetails, setShowLicenseDetails] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState('basic');
  const [audioContext, setAudioContext] = useState(null);
  const [transposedSource, setTransposedSource] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isTransposing, setIsTransposing] = useState(false);
  const [isTransposedPlaying, setIsTransposedPlaying] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [beatDuration, setBeatDuration] = useState(null);

  const navigate = useNavigate();
  const { openLicenseModal } = useLicense();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { currentTrack, isPlaying: globalIsPlaying, playTrack, pauseTrack, isBeatPlaying } = useAudio();

  // Check if this beat is in wishlist using context
  const isInWishlistState = isInWishlist(beat);

  // Check if this beat is currently playing in the global audio context
  const isGloballyPlaying = isBeatPlaying(beat);

  // Determine the actual play state - FIXED LOGIC
  const actuallyPlaying = semitones === 0 ? isGloballyPlaying : isTransposedPlaying;

  // Calculate transposed metadata using useMemo for performance
  const transposedMetadata = useMemo(() => {
    const metadata = getTransposedMetadata(beat, semitones, beatDuration);
    if (semitones !== 0) {
      console.log('Transposed metadata:', {
        originalKey: beat?.key,
        transposedKey: metadata.transposedKey,
        semitones,
        originalBPM: beat?.bpm,
        transposedBPM: metadata.transposedBPM
      });
    }
    return metadata;
  }, [beat, semitones, beatDuration]);

  // Extract the calculated values
  const { pitchRatio, transposedBPM, transposedKey, transposedDuration } = transposedMetadata;

  // Initialize audio context and load audio buffer
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !audioContext && beat?.audioFile && isOpen) {
          const ctx = new AudioCtx();
          setAudioContext(ctx);

          // Load and decode audio file for transposition
          const response = await fetch(beat.audioFile);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(arrayBuffer);
          setAudioBuffer(buffer);
          setAudioInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
        setAudioInitialized(false);
      }
    };

    if (isOpen && beat) {
      initAudio();
    }

    return () => {
      // Cleanup transposed audio source
      if (transposedSource) {
        try {
          transposedSource.stop();
          transposedSource.disconnect();
        } catch (e) {
          // Source might already be stopped
        }
      }
    };
  }, [isOpen, beat]);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSemitones(0);
      setIsTransposedPlaying(false);

      // Stop and cleanup transposed audio
      if (transposedSource) {
        try {
          transposedSource.stop();
          transposedSource.disconnect();
        } catch (e) {
          // Source might already be stopped
        }
        setTransposedSource(null);
      }

      // Close audio context
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().then(() => {
          setAudioContext(null);
          setAudioBuffer(null);
          setAudioInitialized(false);
        });
      }
    }
  }, [isOpen]);

  // FIXED: Monitor global audio changes and sync transposed audio
  useEffect(() => {
    // If global audio stops, stop transposed audio too
    if (!isGloballyPlaying && isTransposedPlaying) {
      stopTransposedAudio();
    }
    
    // If global audio starts and we're in transposed mode, take control
    if (isGloballyPlaying && semitones !== 0 && !isTransposedPlaying) {
      // Stop global audio immediately and start transposed version
      pauseTrack();
      playTransposedAudio();
    }
  }, [isGloballyPlaying, semitones]);

  // Load beat duration
  useEffect(() => {
    if (beat?.audioFile) {
      const audio = new Audio(beat.audioFile);
      audio.addEventListener('loadedmetadata', () => {
        setBeatDuration(audio.duration);
      });
    }
  }, [beat]);

  // Exit early if no beat data or modal not open
  if (!beat || !isOpen) return null;

  // FIXED: Helper function to stop transposed audio
  const stopTransposedAudio = () => {
    if (transposedSource) {
      try {
        transposedSource.onended = null;
        transposedSource.stop(0);
        transposedSource.disconnect();
      } catch (e) {
        console.warn("Error stopping transposed audio", e);
      }
      setTransposedSource(null);
    }
    setIsTransposedPlaying(false);
  };

  // FIXED: Helper function to play transposed audio
  const playTransposedAudio = async () => {
    if (!audioContext || !audioBuffer || !audioInitialized) {
      console.warn('Audio not ready for transposition');
      return false;
    }

    try {
      // CRITICAL: Ensure global audio is completely stopped first
      pauseTrack();
      
      // Stop any existing transposed audio
      stopTransposedAudio();

      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Create new audio source with pitch ratio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = pitchRatio;
      source.connect(audioContext.destination);

      // Set up event handlers
      source.onended = () => {
        setTransposedSource(null);
        setIsTransposedPlaying(false);
      };

      // Start playing
      source.start();
      setTransposedSource(source);
      setIsTransposedPlaying(true);

      // REMOVED: Don't call playTrack here as it causes double audio
      // playTrack(beat); <- THIS WAS THE PROBLEM

      showToast.success(`🎶 Transposed to ${semitones > 0 ? '+' : ''}${semitones} semitone${Math.abs(semitones) === 1 ? '' : 's'}`);
      return true;
    } catch (error) {
      console.error('Error playing transposed audio:', error);
      return false;
    }
  };

  // FIXED: Handle transposition
  const handleTranspose = async (direction) => {
    if (!audioInitialized) {
      console.warn('Audio not initialized for transposition');
      return;
    }

    try {
      setIsTransposing(true);

      let newSemitones = semitones;
      if (direction === 'up' && semitones < 2) {
        newSemitones = semitones + 1;
      } else if (direction === 'down' && semitones > -2) {
        newSemitones = semitones - 1;
      } else {
        setIsTransposing(false);
        return;
      }

      const wasPlaying = actuallyPlaying;
      
      // Stop all audio before changing pitch
      pauseTrack();
      stopTransposedAudio();

      setSemitones(newSemitones);

      // If was playing, restart with new transposition
      if (wasPlaying) {
        // Small delay to ensure audio stops completely
        setTimeout(() => {
          if (newSemitones === 0) {
            // Back to original - use global audio player
            playTrack(beat);
          } else {
            // Play with new transposition
            playTransposedAudio();
          }
        }, 50);
      }

      showToast.success(`Transposed to ${newSemitones} semitones`);

    } catch (error) {
      console.error('Error during transposition:', error);
    } finally {
      setIsTransposing(false);
    }
  };

  // FIXED: Handle play/pause with clear logic
  const handlePlayPause = async () => {
    try {
      // If currently playing (either version) → pause everything
      if (actuallyPlaying) {
        pauseTrack();
        stopTransposedAudio();
        return;
      }

      // If nothing is playing → start appropriate version
      if (semitones === 0) {
        // Original version - use global audio player
        playTrack(beat);
      } else {
        // Transposed version - use custom audio
        await playTransposedAudio();
      }
    } catch (error) {
      console.error("Error in play/pause:", error);
    }
  };

  // Handle license selection
  const handleSelectLicense = (licenseType) => {
    setSelectedLicense(licenseType);

    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    // Get license details
    const license = licenseInfo[licenseType];

    // Use context to handle license selection
    openLicenseModal(beat, (beatWithLicense) => {
      try {
        // Get existing cart
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');

        // Check if already in cart with same license
        const isInCart = cart.some(item =>
          item._id === beatWithLicense._id &&
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
        onClose(); // Close the single beat modal after adding to cart
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Error adding to cart. Please try again.");
      }
    });
  };

  // Handle wishlist toggle using context
  const handleWishlistToggle = () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to wishlist");
      navigate("/login");
      return;
    }

    // Use context function directly
    const result = toggleWishlist(beat);

    if (result.success && result.message) {
      console.log(result.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // License information
  const licenseInfo = {
    basic: {
      name: 'Basic License',
      price: beat.price || 4.99,
      benefits: [
        'MP3 File',
        'No royalties',
        'Must credit producer'
      ]
    },
    premium: {
      name: 'Premium License',
      price: (beat.price || 4.99) * 2.5,
      benefits: [
        'WAV + MP3 Files',
        'No royalties',
        'Must credit producer'
      ]
    },
    exclusive: {
      name: 'Exclusive License',
      price: (beat.price || 4.99) * 10,
      benefits: [
        'WAV + MP3 + Stems',
        'Full ownership',
        'Beat removed from store'
      ]
    }
  };

  // Handle add to cart with global license modal
  const handleAddToCartWithLicense = () => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    openLicenseModal(beat, (beatWithLicense) => {
      try {
        // Check if already in cart
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const isInCart = cart.some(item =>
          item._id === beatWithLicense._id &&
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
        onClose(); // Close the single beat modal
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Error adding to cart. Please try again.");
      }
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        <div className={styles.beatDetails}>
          {/* Left column: Image and controls */}
          <div className={styles.beatImageSection}>
            <div className={styles.imageContainer}>
              <img
                src={beat.coverImage || "/default-cover.jpg"}
                alt={beat.title}
                className={styles.beatImage}
                onError={(e) => { e.target.src = "/default-cover.jpg" }}
              />

              <button
                className={styles.playButton}
                onClick={handlePlayPause}
                disabled={isTransposing || isLoading}
              >
                {isLoading || isTransposing ? (
                  <div className={styles.loadingDots}></div>
                ) : actuallyPlaying ? (
                  <FaPause />
                ) : (
                  <FaPlay />
                )}
              </button>
            </div>

            <div className={styles.transpositionControls}>
              <span className={styles.transpositionLabel}>Transpose:</span>
              <button
                className={styles.transposeButton}
                onClick={() => handleTranspose('down')}
                disabled={semitones <= -2 || isTransposing || !audioInitialized}
              >
                <FaMinus />
              </button>
              <span className={`${styles.semitoneValue} ${semitones !== 0 ? styles.active : ''}`}>
                {semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <button
                className={styles.transposeButton}
                onClick={() => handleTranspose('up')}
                disabled={semitones >= 2 || isTransposing || !audioInitialized}
              >
                <FaPlus />
              </button>
            </div>

            {/* Processing indicator */}
            {isTransposing && (
              <div className={styles.transposingIndicator}>
                Processing...
              </div>
            )}

            {/* Audio status indicator */}
            {!audioInitialized && isOpen && (
              <div className={styles.audioStatusIndicator}>
                Loading audio for transposition...
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                className={`${styles.cartButton} ${isInCart ? styles.inCart : ''}`}
                onClick={handleAddToCartWithLicense}
                disabled={isInCart}
              >
                <FaCartPlus /> {isInCart ? 'In Cart' : 'Add to Cart'}
              </button>

              <button
                className={`${styles.wishlistButton} ${isInWishlistState ? styles.inWishlist : ''}`}
                onClick={handleWishlistToggle}
              >
                <FaHeart /> {isInWishlistState ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          {/* Right column: Beat information */}
          <div className={styles.beatInfoSection}>
            <h2 className={styles.beatTitle}>{beat.title}</h2>

            <div className={styles.producerInfo}>
              <span className={styles.producerName}>by {beat.producer?.name || "Unknown Producer"}</span>
              {beat.producer?.verified && <span className={styles.verifiedBadge}>✓</span>}
            </div>

            <div className={styles.beatMetadata}>
              <div className={styles.metadataItem}>
                <FaMusic className={styles.metadataIcon} />
                <span className={styles.metadataLabel}>Genre:</span>
                <span className={styles.metadataValue}>{beat.genre || "Unknown"}</span>
              </div>

              <div className={styles.metadataItem}>
                <FaHashtag className={styles.metadataIcon} />
                <span className={styles.metadataLabel}>BPM:</span>
                <span className={styles.metadataValue}>
                  {semitones === 0 ? (beat.bpm || "N/A") : transposedBPM}
                </span>
              </div>

              <div className={styles.metadataItem}>
                <FaMusic className={styles.metadataIcon} />
                <span className={styles.metadataLabel}>Key:</span>
                <span className={styles.metadataValue}>
                  {semitones === 0 ? (beat.key || "N/A") : transposedKey}
                </span>
              </div>

              <div className={styles.metadataItem}>
                <FaClock className={styles.metadataIcon} />
                <span className={styles.metadataLabel}>Duration:</span>
                <span className={styles.metadataValue}>
                  {semitones === 0 ? formatDuration(beatDuration) : formatDuration(transposedDuration)}
                </span>
              </div>

              <div className={styles.metadataItem}>
                <FaCalendarAlt className={styles.metadataIcon} />
                <span className={styles.metadataLabel}>Released:</span>
                <span className={styles.metadataValue}>{formatDate(beat.createdAt)}</span>
              </div>
            </div>

            {beat.description && (
              <div className={styles.description}>
                <h3>Description</h3>
                <p>{beat.description}</p>
              </div>
            )}

            {/* Tags */}
            {beat.tags && beat.tags.length > 0 && (
              <div className={styles.tags}>
                {beat.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* License info section - just for display */}
        <div className={styles.licenseSection}>
          <h3 className={styles.licenseHeader}>
            Available Licenses
            <button
              className={styles.licenseToggle}
              onClick={() => setShowLicenseDetails(!showLicenseDetails)}
            >
              {showLicenseDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </h3>

          <div className={styles.licenseOptions}>
            {Object.entries(licenseInfo).map(([key, license]) => (
              <div key={key} className={`${styles.licenseOption} ${selectedLicense === key ? styles.selectedLicense : ''}`}>
                <div className={styles.licenseTop}>
                  <h4 className={styles.licenseName}>{license.name}</h4>
                  <span className={styles.licensePrice}>Rs {license.price.toFixed(2)}</span>
                </div>

                {showLicenseDetails && (
                  <div className={styles.licenseBenefits}>
                    <ul>
                      {license.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleBeatModal;