import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPause, FaShoppingCart, FaTrash, FaHeart } from "react-icons/fa";
import styles from "../css/Favorites.module.css";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import LicenseSelectionModal from '../Components/LicenseSelectionModal';
import { getBeatId } from '../utils/audioUtils';
import { showToast } from '../utils/toast';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(new Audio());
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedBeatForLicense, setSelectedBeatForLicense] = useState(null);

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

  const handleAddToCart = (event, beat) => {
    event.stopPropagation();

    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      showToast.loginRequired();
      navigate("/login");
      return;
    }

    setSelectedBeatForLicense(beat);
    setShowLicenseModal(true);
  };

  // Handle license selection
  const handleLicenseSelect = (beatWithLicense) => {
    const isInCart = cartItems.some(item =>
      getBeatId(item) === getBeatId(beatWithLicense) &&
      item.selectedLicense === beatWithLicense.selectedLicense
    );

    if (isInCart) {
      showToast.warning(`"${beatWithLicense.title}" with ${beatWithLicense.licenseName} is already in your cart`);
      return;
    }

    const updatedCart = [...cartItems, beatWithLicense];
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    setShowLicenseModal(false);
    setSelectedBeatForLicense(null);
    showToast.addedToCart(beatWithLicense.title, beatWithLicense.licenseName);
  };
  // Use context function to check wishlist status
  const isInCart = (beatId) => {
    return cartItems.some(item => getBeatId(item) === beatId);
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
          <h1>Your Wishlist</h1>
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
                    className={`${styles.cartButton} ${isInCart(getBeatId(beat)) ? styles.inCart : ''}`}
                    onClick={(e) => handleAddToCart(e, beat)}
                    disabled={isInCart(getBeatId(beat))}
                  >
                    <FaShoppingCart /> {isInCart(getBeatId(beat)) ? 'In Cart' : 'Add to Cart'}
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
        {/* Single Beat Modal */}
        {selectedBeat && (
          <SingleBeatModal
            beat={selectedBeat}
            isOpen={!!selectedBeat}
            onClose={handleCloseModal}
            onAddToCart={(beat) => handleAddToCart({ stopPropagation: () => { } }, beat)}
            onToggleWishlist={(beat) => handleToggleWishlist({ stopPropagation: () => { } }, beat)}
            isInCart={isInCart(getBeatId(selectedBeat))}
            isPlaying={isBeatPlaying(selectedBeat)}
            onPlayPause={(e) => handlePlayPreview(e, selectedBeat)}
            isLoading={false}
          />
        )}
        {/* License Selection Modal */}
        {showLicenseModal && selectedBeatForLicense && (
          <LicenseSelectionModal
            beat={selectedBeatForLicense}
            onClose={() => {
              setShowLicenseModal(false);
              setSelectedBeatForLicense(null);
            }}
            onSelectLicense={handleLicenseSelect}
          />
        )}
      </div>
    </div>
  );
};

export default Favorites;