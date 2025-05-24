// src/Components/TrendingBeats.jsx
import React, { useState, useEffect } from 'react';
import { FaPlay, FaPause, FaHeart, FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import styles from '../css/TrendingBeats.module.css';
import API from '../api/api';
import { useAudio } from '../context/AudioContext';
import { useNavigate } from 'react-router-dom';
import SingleBeatModal from './Singlebeatmodal';
import LicenseSelectionModal from './LicenseSelectionModal';
import ProducerProfile from './ProducerProfile';
import { showToast } from '../utils/toast';

const TrendingBeats = () => {
  const [trendingBeats, setTrendingBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  // Modal states
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedBeatForLicense, setSelectedBeatForLicense] = useState(null);
  const [showProducerProfile, setShowProducerProfile] = useState(false);
  const [selectedProducerId, setSelectedProducerId] = useState(null);

  // Scroll states
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Use the audio context
  const { playTrack, currentTrack, isPlaying } = useAudio();
  
  // Load wishlist and cart from localStorage
  useEffect(() => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(savedWishlist);
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(savedCart);
    } catch (error) {
      console.error('Error loading localStorage data:', error);
    }
  }, []);

  // Fetch trending beats
  useEffect(() => {
    const fetchTrendingBeats = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/beats/trending');
        const beatsData = response.data.data || [];
        setTrendingBeats(beatsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trending beats:', err);
        setError('Failed to load trending beats');
        setLoading(false);
        
        // Fallback data
        setTrendingBeats([
          {
            _id: "sample1",
            title: "Summer Vibes",
            producer: { name: "DJ Beats", _id: "prod1", verificationStatus: "approved" },
            coverImage: "/default-cover.jpg",
            audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            price: 19.99,
            genre: "Trap"
          },
          // Add more sample beats...
        ]);
      }
    };
    
    fetchTrendingBeats();
  }, []);

  // Scroll functions
  const scrollLeft = () => {
    const container = document.querySelector(`.${styles.beatsContainer}`);
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.querySelector(`.${styles.beatsContainer}`);
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    setScrollPosition(scrollLeft);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Play functionality
  const handlePlayPreview = (event, beat) => {
    event.stopPropagation();
    playTrack(beat);
    
    try {
      API.post(`/api/beats/${beat._id}/play`).catch(err => {
        console.log("Could not update play count, ignoring:", err);
      });
    } catch (error) {
      // Silently ignore tracking errors
    }
  };

  // Add to cart functionality
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

  const handleLicenseSelect = (beatWithLicense) => {
    const isInCart = cartItems.some(item =>
      item._id === beatWithLicense._id &&
      item.selectedLicense === beatWithLicense.selectedLicense
    );

    if (isInCart) {
      showToast.warning(`"${beatWithLicense.title}" with ${beatWithLicense.licenseName} is already in your cart! 🛒`);
      return;
    }

    const updatedCart = [...cartItems, beatWithLicense];
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    setShowLicenseModal(false);
    setSelectedBeatForLicense(null);
    showToast.addedToCart(beatWithLicense.title, beatWithLicense.licenseName);
  };

  // Wishlist functionality
  const toggleWishlist = (event, beat) => {
    event.stopPropagation();
    
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      showToast.loginRequired();
      navigate("/login");
      return;
    }

    const isInWishlist = wishlist.some(item => item._id === beat._id);
    let updatedWishlist;

    if (isInWishlist) {
      updatedWishlist = wishlist.filter(item => item._id !== beat._id);
      showToast.removedFromWishlist(beat.title);
    } else {
      updatedWishlist = [...wishlist, beat];
      showToast.addedToWishlist(beat.title);
    }

    setWishlist(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  // Helper functions
  const isInWishlist = (beatId) => wishlist.some(item => item._id === beatId);
  const isInCart = (beatId) => cartItems.some(item => item._id === beatId);

  const handleBeatClick = (beat) => {
    setSelectedBeat(beat);
  };

  const handleProducerClick = (e, producerId) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedProducerId(producerId);
    setShowProducerProfile(true);
  };

  if (loading) {
    return <div className={styles.loading}>Loading trending beats...</div>;
  }

  if (error && trendingBeats.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.trendingSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Trending Beats</h2>
        <div className={styles.headerActions}>
          <div className={styles.scrollControls}>
            <button 
              className={`${styles.scrollButton} ${!canScrollLeft ? styles.disabled : ''}`}
              onClick={scrollLeft}
              disabled={!canScrollLeft}
            >
              <FaChevronLeft />
            </button>
            <button 
              className={`${styles.scrollButton} ${!canScrollRight ? styles.disabled : ''}`}
              onClick={scrollRight}
              disabled={!canScrollRight}
            >
              <FaChevronRight />
            </button>
          </div>
          <button 
            className={styles.seeMoreButton} 
            onClick={() => navigate('/BeatExplorePage')}
          >
            See all
          </button>
        </div>
      </div>

      <div 
        className={styles.beatsContainer} 
        onScroll={handleScroll}
      >
        {trendingBeats.map((beat) => {
          const isThisPlaying = 
            isPlaying && 
            currentTrack && 
            (currentTrack._id === beat._id || currentTrack.id === beat.id);
              
          return (
            <div 
              key={beat._id} 
              className={styles.beatCard}
              onClick={() => handleBeatClick(beat)}
            >
              <div className={styles.imageContainer}>
                <img 
                  src={beat.coverImage || "/default-cover.jpg"} 
                  alt={beat.title} 
                  className={styles.beatImage}
                  onError={(e) => {
                    e.target.src = "/default-cover.jpg";
                  }}
                />
                <div className={styles.imageOverlay}>
                  <button 
                    className={styles.playButton}
                    onClick={(e) => handlePlayPreview(e, beat)}
                  >
                    {isThisPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
              </div>

              <div className={styles.beatInfo}>
                <h3 className={styles.beatTitle}>{beat.title}</h3>
                <div 
                  className={styles.producerInfo}
                  onClick={(e) => handleProducerClick(e, beat.producer._id)}
                >
                  <span className={styles.producerName}>
                    {beat.producer?.name || "Unknown"}
                  </span>
                  {beat.producer?.verificationStatus === "approved" && (
                    <BsCheckCircleFill className={styles.verifiedIcon} />
                  )}
                </div>
                <div className={styles.beatMeta}>
                  <span className={styles.genre}>{beat.genre}</span>
                  <span className={styles.price}>Rs {beat.price?.toFixed(2) || "0.00"}</span>
                </div>
              </div>

              <div className={styles.beatActions}>
                <button 
                  className={`${styles.wishlistButton} ${isInWishlist(beat._id) ? styles.inWishlist : ''}`}
                  onClick={(e) => toggleWishlist(e, beat)}
                >
                  <FaHeart />
                </button>
                <button 
                  className={`${styles.cartButton} ${isInCart(beat._id) ? styles.inCart : ''}`}
                  onClick={(e) => handleAddToCart(e, beat)}
                  disabled={isInCart(beat._id)}
                >
                  <FaShoppingCart />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedBeat && (
        <SingleBeatModal
          beat={selectedBeat}
          isOpen={!!selectedBeat}
          onClose={() => setSelectedBeat(null)}
          onAddToCart={(beat) => handleAddToCart({ stopPropagation: () => {} }, beat)}
          onToggleWishlist={(beat) => toggleWishlist({ stopPropagation: () => {} }, beat)}
          isInCart={isInCart(selectedBeat._id)}
          isInWishlist={isInWishlist(selectedBeat._id)}
          isPlaying={currentTrack?._id === selectedBeat._id && isPlaying}
          onPlayPause={(e) => handlePlayPreview(e, selectedBeat)}
        />
      )}

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

      {showProducerProfile && selectedProducerId && (
        <ProducerProfile
          producerId={selectedProducerId}
          isOpen={showProducerProfile}
          onClose={() => {
            setShowProducerProfile(false);
            setSelectedProducerId(null);
          }}
        />
      )}
    </div>
  );
};

export default TrendingBeats;