import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPause, FaShoppingCart, FaTrash, FaHeart } from "react-icons/fa";
import styles from "../css/Favorites.module.css";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(new Audio());
  const navigate = useNavigate();

  // Load favorites from localStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storedFavorites = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setFavorites(storedFavorites);
      } catch (error) {
        console.error("Error loading favorites:", error);
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();

    // Cleanup audio player
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }
    };
  }, []);

  // Handle play/pause audio
  const handlePlayPause = (beat) => {
    const beatId = beat._id;
    const audioUrl = beat.audioFile || beat.audioUrl;

    if (!audioUrl) {
      console.error("No audio URL found for this beat");
      return;
    }

    if (currentlyPlaying === beatId) {
      // Toggle play/pause for current beat
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    } else {
      // Play a new beat
      audioPlayer.pause();
      audioPlayer.src = audioUrl;
      audioPlayer.play();
      setCurrentlyPlaying(beatId);

      // Set ended event to reset state
      audioPlayer.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  // Add to cart
  const addToCart = (beat) => {
    try {
      // Get current cart
      const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
      
      // Check if beat is already in cart
      const beatInCart = cartItems.some(item => item._id === beat._id);
      
      if (beatInCart) {
        alert(`"${beat.title}" is already in your cart`);
        return;
      }
      
      // Add to cart
      cartItems.push(beat);
      localStorage.setItem("cart", JSON.stringify(cartItems));
      
      alert(`"${beat.title}" added to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // Remove from favorites
  const removeFromFavorites = (beat) => {
    try {
      const updatedFavorites = favorites.filter(item => item._id !== beat._id);
      setFavorites(updatedFavorites);
      localStorage.setItem("wishlist", JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <NavbarBeatExplore />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <NavbarBeatExplore />
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h1>Your Favorites</h1>
          <p className={styles.subheading}>
            <FaHeart className={styles.heartIcon} /> 
            {favorites.length} {favorites.length === 1 ? 'beat' : 'beats'} saved to your wishlist
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FaHeart />
            </div>
            <h3>Your wishlist is empty</h3>
            <p>Save beats you like to listen to them later or keep track of your favorites.</p>
            <button 
              className={styles.exploreButton}
              onClick={() => navigate("/BeatExplorePage")}
            >
              Explore Beats
            </button>
          </div>
        ) : (
          <div className={styles.beatsGrid}>
            {favorites.map((beat) => (
              <div key={beat._id} className={styles.beatCard}>
                <div className={styles.imageContainer}>
                  <img 
                    src={beat.coverImage || "/default-cover.jpg"} 
                    alt={beat.title}
                    className={styles.beatImage}  
                  />
                  <button 
                    className={styles.playButton}
                    onClick={() => handlePlayPause(beat)}
                  >
                    {currentlyPlaying === beat._id ? <FaPause /> : <FaPlay />}
                  </button>
                </div>

                <div className={styles.beatInfo}>
                  <h3>{beat.title}</h3>
                  <p className={styles.producer}>{beat.producer?.name || beat.artist || "Unknown Producer"}</p>
                  <p className={styles.price}>${beat.price.toFixed(2)}</p>
                </div>

                <div className={styles.beatActions}>
                  <button 
                    className={styles.cartButton}
                    onClick={() => addToCart(beat)}
                  >
                    <FaShoppingCart /> Add to Cart
                  </button>
                  <button 
                    className={styles.removeButton}
                    onClick={() => removeFromFavorites(beat)}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;