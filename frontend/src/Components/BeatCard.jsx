// frontend/src/Components/BeatCard.jsx
import React from "react";
import { FaPlay, FaPause, FaHeart, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAudio } from "../context/AudioContext";
import { useWishlist } from "../context/WishlistContext"; // Added direct wishlist context
import { useLicense } from "../context/LicenseContext";
import { getBeatId, isBeatPlaying } from "../utils/audioUtils";
import styles from "../css/BeatCard.module.css";

const BeatCard = ({ beat }) => { // Removed onToggleWishlist and isInWishlist props
  const audioContext = useAudio();
  const { playTrack, isBeatPlaying: checkIsBeatPlaying } = audioContext;
  const { openLicenseModal } = useLicense();
  const { toggleWishlist, isInWishlist } = useWishlist(); // Use wishlist context directly
  const navigate = useNavigate();
  
  // Use the context's helper function for consistency
  const isThisPlaying = checkIsBeatPlaying(beat);
  
  // Check if this beat is in wishlist
  const isInWishlistState = isInWishlist(beat);
  
  // Debug logging (remove in production)
  React.useEffect(() => {
    const beatId = getBeatId(beat);
    console.log(`BeatCard ${beatId} - isThisPlaying: ${isThisPlaying}, isInWishlist: ${isInWishlistState}`);
  }, [isThisPlaying, isInWishlistState, beat]);
  
  // Handle play button click
  const handlePlayClick = (e) => {
    e.stopPropagation();
    console.log('Play button clicked for beat:', getBeatId(beat));
    playTrack(beat);
  };
  
  // Add to cart handler
  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    // Open license modal with callback
    openLicenseModal(beat, (beatWithLicense) => {
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
  
  // UPDATED: Toggle wishlist using context directly
  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    
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

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img 
          src={beat.coverImage || "/default-cover.jpg"} 
          alt={beat.title} 
          className={styles.coverImage} 
        />
        <div className={styles.overlay}>
          <button 
            className={styles.playButton}
            onClick={handlePlayClick}
            aria-label={isThisPlaying ? "Pause" : "Play"}
          >
            {isThisPlaying ? <FaPause /> : <FaPlay />}
          </button>
        </div>
      </div>
      
      <div className={styles.beatInfo}>
        <h3 className={styles.title}>{beat.title}</h3>
        <p className={styles.producer}>
          {beat.producer?.name || beat.artist || "Unknown Producer"}
          {beat.producer?.verified && <span className={styles.verified}>✓</span>}
        </p>
        
        <div className={styles.beatActions}>
          <span className={styles.price}>${beat.price?.toFixed(2) || "0.00"}</span>
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.cartButton}
              onClick={handleAddToCart}
              aria-label="Add to cart"
            >
              <FaShoppingCart />
            </button>
            
            <button 
              className={`${styles.wishlistButton} ${isInWishlistState ? styles.active : ""}`}
              onClick={handleToggleWishlist}
              aria-label={isInWishlistState ? "Remove from wishlist" : "Add to wishlist"}
            >
              <FaHeart />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeatCard;