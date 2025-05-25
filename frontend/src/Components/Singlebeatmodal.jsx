import React, { useState, useEffect } from 'react';
import { useLicense } from '../context/LicenseContext';
import { useWishlist } from '../context/WishlistContext';
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

const SingleBeatModal = ({ 
  beat,
  isOpen,
  onClose,
  onAddToCart,
  isInCart,
  isPlaying,
  onPlayPause,
  isLoading
}) => {
  const [semitones, setSemitones] = useState(0);
  const [showLicenseDetails, setShowLicenseDetails] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState('basic');
  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [isTransposing, setIsTransposing] = useState(false);
  const navigate = useNavigate();
  const { openLicenseModal } = useLicense();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  // Check if this beat is in wishlist using context
  const isInWishlistState = isInWishlist(beat);
  
  // Initialize audio context and load audio buffer
  useEffect(() => {
    const initAudio = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !audioContext && beat?.audioFile) {
          const ctx = new AudioCtx();
          setAudioContext(ctx);
          
          // Load and decode audio file for transposition
          const response = await fetch(beat.audioFile);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await ctx.decodeAudioData(arrayBuffer);
          setAudioBuffer(buffer);
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    if (isOpen && beat) {
      initAudio();
    }

    return () => {
      if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [isOpen, beat]);

  // Reset transposition when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSemitones(0);
      if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
        setAudioSource(null);
      }
    }
  }, [isOpen]);
  
  // Exit early if no beat data or modal not open
  if (!beat || !isOpen) return null;
  
  // Handle transposition with actual audio processing
  const handleTranspose = async (direction) => {
    if (!audioContext || !audioBuffer) {
      console.warn('Audio context or buffer not ready');
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

      setSemitones(newSemitones);
      
      // Calculate pitch shift ratio (each semitone = 2^(1/12))
      const pitchRatio = Math.pow(2, newSemitones / 12);
      
      // Stop current audio source if playing
      if (audioSource) {
        audioSource.stop();
        audioSource.disconnect();
        setAudioSource(null);
      }

      // Create new audio source with pitch shift
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = pitchRatio;
      source.connect(audioContext.destination);
      
      // Start playing if currently playing
      if (isPlaying) {
        await audioContext.resume();
        source.start();
        setAudioSource(source);
        
        source.onended = () => {
          setAudioSource(null);
        };
      } else {
        setAudioSource(source);
      }
      
      console.log(`Transposed to ${newSemitones} semitones (pitch ratio: ${pitchRatio.toFixed(3)})`);
      
    } catch (error) {
      console.error('Error during transposition:', error);
    } finally {
      setIsTransposing(false);
    }
  };

  // Handle play/pause with transposition support
  const handlePlayPause = async () => {
    if (!audioContext || !audioBuffer) {
      // Fallback to original audio player
      onPlayPause();
      return;
    }

    try {
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (isPlaying && audioSource) {
        // Stop transposed audio
        audioSource.stop();
        audioSource.disconnect();
        setAudioSource(null);
      } else {
        // Start transposed audio
        const pitchRatio = Math.pow(2, semitones / 12);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = pitchRatio;
        source.connect(audioContext.destination);
        source.start();
        setAudioSource(source);
        
        source.onended = () => {
          setAudioSource(null);
        };
      }
      
      // Update the parent component's play state
      onPlayPause();
      
    } catch (error) {
      console.error('Error playing transposed audio:', error);
      // Fallback to original audio
      onPlayPause();
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
    
    // Optional: Log the result (you can remove this or replace with toast notification)
    if (result.success && result.message) {
      console.log(result.message); // Just log instead of alert for better UX
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
                onError={(e) => {e.target.src = "/default-cover.jpg"}}
              />
              
              <button 
                className={styles.playButton}
                onClick={handlePlayPause}
                disabled={isTransposing}
              >
                {isLoading || isTransposing ? (
                  <div className={styles.loadingDots}></div>
                ) : isPlaying ? (
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
                disabled={semitones <= -2 || isTransposing}
              >
                <FaMinus />
              </button>
              <span className={styles.semitoneValue}>
                {semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <button 
                className={styles.transposeButton}
                onClick={() => handleTranspose('up')}
                disabled={semitones >= 2 || isTransposing}
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
                <span className={styles.metadataValue}>{beat.bpm || "N/A"}</span>
              </div>
              
              <div className={styles.metadataItem}>
                <FaMusic className={styles.metadataIcon} />
                <span className={styles.metadataLabel}>Key:</span>
                <span className={styles.metadataValue}>{beat.key || "N/A"}</span>
              </div>
              
              <div className={styles.metadataItem}>
                <FaClock className={styles.metadataIcon} />
                <span className={styles.metadataLabel}>Duration:</span>
                <span className={styles.metadataValue}>{beat.duration || "N/A"}</span>
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