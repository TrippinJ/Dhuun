import React, { useState, useEffect } from 'react';
import { useLicense } from '../context/LicenseContext';
import styles from '../css/SingleBeatModal.module.css';
import { 
  FaPlay, 
  FaPause, 
  FaCartPlus, 
  FaHeart, 
  FaShareAlt, 
  FaDownload,
  FaTimes,
  FaMusic,
  FaClock,
  FaCalendarAlt,
  FaHashtag,
  FaPlus,
  FaMinus,
  FaCheck
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SingleBeatModal = ({ 
  beat,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isInCart,
  isInWishlist,
  isPlaying,
  onPlayPause,
  isLoading
}) => {
  const [semitones, setSemitones] = useState(0);
  const [showLicenseDetails, setShowLicenseDetails] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState('basic');
  const [audioContext, setAudioContext] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  const navigate = useNavigate();
  const { openLicenseModal } = useLicense();
  
  // Initialize audio context for transposition
  useEffect(() => {
    // Create AudioContext only when needed (user interaction)
    const initAudioContext = () => {
      // Use standard AudioContext or the webkit prefix for Safari
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx && !audioContext) {
        setAudioContext(new AudioCtx());
      }
    };
    
    // Add event listener to initialize audio context on user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    
    return () => {
      document.removeEventListener('click', initAudioContext);
      // Clean up audio context when component unmounts
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext]);
  
  // Exit early if no beat data or modal not open
  if (!beat || !isOpen) return null;
  
  // Handle transposition
  const handleTranspose = (direction) => {
    if (direction === 'up' && semitones < 12) {
      setSemitones(semitones + 1);
    } else if (direction === 'down' && semitones > -12) {
      setSemitones(semitones - 1);
    }
    
    // Apply transposition effect
    // Note: In a real implementation, this would modify the playback rate
    // of the audio to achieve the semitone shift effect
    console.log(`Transposed to ${semitones} semitones`);
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
        'No royalties'
      ]
    },
    premium: {
      name: 'Premium License',
      price: (beat.price || 4.99) * 2.5,
      benefits: [
        'WAV + MP3 Files',
        'No royalties'
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
                onClick={onPlayPause}
              >
                {isLoading ? (
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
                disabled={semitones <= -2}
              >
                <FaMinus />
              </button>
              <span className={styles.semitoneValue}>
                {semitones > 0 ? `+${semitones}` : semitones}
              </span>
              <button 
                className={styles.transposeButton}
                onClick={() => handleTranspose('up')}
                disabled={semitones >= 2}
              >
                <FaPlus />
              </button>
            </div>
            
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.cartButton} ${isInCart ? styles.inCart : ''}`}
                onClick={handleAddToCartWithLicense}
                disabled={isInCart}
              >
                <FaCartPlus /> {isInCart ? 'In Cart' : 'Add to Cart'}
              </button>
              
              <button 
                className={`${styles.wishlistButton} ${isInWishlist ? styles.inWishlist : ''}`}
                onClick={() => onToggleWishlist(beat)}
              >
                <FaHeart /> {isInWishlist ? 'Saved' : 'Save'}
              </button>
              
              <button className={styles.shareButton}>
                <FaShareAlt /> Share
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