// src/Components/BeatCard.jsx
import React from "react";
import { FaPlay, FaPause, FaHeart, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAudio } from "../context/AudioContext";
import { useLicense } from "../context/LicenseContext";
import styles from "../css/BeatCard.module.css";

const BeatCard = ({ beat, onToggleWishlist, isInWishlist }) => {
  const { currentTrack, isPlaying, playTrack } = useAudio();
  const { openLicenseModal } = useLicense();
  const navigate = useNavigate();
  
  // Check if this beat is currently playing
  const isThisPlaying = 
    isPlaying && 
    currentTrack && 
    (currentTrack._id === beat._id || currentTrack.id === beat.id);
  
  // Handle play button click
  const handlePlayClick = (e) => {
    e.stopPropagation();
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
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Error adding to cart. Please try again.");
      }
    });
  };
  
  // Toggle wishlist handler
  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    if (onToggleWishlist) onToggleWishlist(beat);
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
              className={`${styles.wishlistButton} ${isInWishlist ? styles.active : ""}`}
              onClick={handleToggleWishlist}
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
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