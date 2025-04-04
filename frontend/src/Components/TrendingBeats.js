import React, { useState, useEffect } from 'react';
import { FaPlay, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import styles from '../css/TrendingBeats.module.css';
import API from '../api/api';

const TrendingBeats = () => {
  const [trendingBeats, setTrendingBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch trending beats from API
  useEffect(() => {
    const fetchTrendingBeats = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/beats/trending');
        setTrendingBeats(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trending beats:', err);
        setError('Failed to load trending beats');
        setLoading(false);
      }
    };
    
    fetchTrendingBeats();
  }, []);

  // Handle play button click
  const handlePlay = (id) => {
    console.log(`Play beat ${id}`);
    // Implement audio playback functionality
  };

  // Handle add to cart
  const handleAddToCart = (beat) => {
    console.log(`Add beat ${beat.id} to cart`);
    // Get existing cart or initialize empty array
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    // Add beat to cart
    cart.push(beat);
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    // Show feedback to user
    alert(`${beat.title} added to cart!`);
  };

  // Handle favorite
  const handleFavorite = (id) => {
    console.log(`Add beat ${id} to favorites`);
    // Implement favorites functionality
  };

  // Handle see more click
  const handleSeeMore = () => {
    console.log('See more beats');
    window.location.href = '/BeatExplorePage';
  };

  if (loading) {
    return <div className={styles.loading}>Loading trending beats...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Trending tracks</h2>
        <button className={styles.seeMoreButton} onClick={handleSeeMore}>
          See more
        </button>
      </div>

      <div className={styles.beatsGrid}>
        {trendingBeats.length > 0 ? (
          trendingBeats.map((beat) => (
            <div key={beat._id} className={styles.beatCard}>
              <div className={styles.imageContainer}>
                <img src={beat.coverImage || "https://via.placeholder.com/300x300"} alt={beat.title} className={styles.beatImage} />
                <div className={styles.imageOverlay}>
                  <button 
                    className={styles.playButton}
                    onClick={() => handlePlay(beat._id)}
                  >
                    <FaPlay />
                  </button>
                  <button 
                    className={styles.favoriteButton}
                    onClick={() => handleFavorite(beat._id)}
                  >
                    <FaHeart />
                  </button>
                </div>
              </div>

              <div className={styles.beatInfo}>
                <h3 className={styles.beatTitle}>{beat.title}</h3>
                <div className={styles.producerInfo}>
                  <span className={styles.producerName}>{beat.producer?.name || "Unknown"}</span>
                  {beat.producer?.verified && (
                    <BsCheckCircleFill className={styles.verifiedIcon} />
                  )}
                </div>
                <div className={styles.beatActions}>
                  <span className={styles.price}>${beat.price?.toFixed(2) || "0.00"}</span>
                  <button 
                    className={styles.cartButton}
                    onClick={() => handleAddToCart(beat)}
                  >
                    <FaShoppingCart />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noBeats}>No trending beats available</div>
        )}
      </div>
    </>
  );
};

export default TrendingBeats;