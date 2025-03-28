import React from 'react';
import { FaPlay, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import styles from '../css/TrendingBeats.module.css';

const TrendingBeats = () => {
  // Sample trending beats data (replace with your actual data later)
  const trendingBeats = [
    {
      id: 1,
      title: "3AM IN OAKLAND",
      producer: "Desirez",
      image: "https://via.placeholder.com/300x300",
      price: 34.99,
      isVerified: true
    },
    {
      id: 2,
      title: "(FREE) 4Batz",
      producer: "$K",
      image: "https://via.placeholder.com/300x300",
      price: 17.99,
      isVerified: true
    },
    {
      id: 3,
      title: "TIMING ⚡1 + 1 FREE",
      producer: "SIGHOST",
      image: "https://via.placeholder.com/300x300",
      price: 29.99,
      isVerified: true
    },
    {
      id: 4,
      title: "100 BEATS FOR $100",
      producer: "waytoolost",
      image: "https://via.placeholder.com/300x300",
      price: 100.00,
      isVerified: true
    },
    {
      id: 5,
      title: "BALENCIAGA",
      producer: "KISSES BEATS",
      image: "https://via.placeholder.com/300x300",
      price: 24.99,
      isVerified: true
    },
    {
      id: 6,
      title: "SORRY | Juice WRLD",
      producer: "Aleksandr Ches Music",
      image: "https://via.placeholder.com/300x300",
      price: 19.99,
      isVerified: true
    }
  ];

  // Handle play button click
  const handlePlay = (id) => {
    console.log(`Play beat ${id}`);
    // Implement audio playback functionality
  };

  // Handle add to cart
  const handleAddToCart = (id) => {
    console.log(`Add beat ${id} to cart`);
    // Implement add to cart functionality
  };

  // Handle favorite
  const handleFavorite = (id) => {
    console.log(`Add beat ${id} to favorites`);
    // Implement favorites functionality
  };

  // Handle see more click
  const handleSeeMore = () => {
    console.log('See more beats');
    // Navigate to browse all beats page
  };

  return (
    <>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Trending tracks</h2>
        <button className={styles.seeMoreButton} onClick={handleSeeMore}>
          See more
        </button>
      </div>

      <div className={styles.beatsGrid}>
        {trendingBeats.map((beat) => (
          <div key={beat.id} className={styles.beatCard}>
            <div className={styles.imageContainer}>
              <img src={beat.image} alt={beat.title} className={styles.beatImage} />
              <div className={styles.imageOverlay}>
                <button 
                  className={styles.playButton}
                  onClick={() => handlePlay(beat.id)}
                >
                  <FaPlay />
                </button>
                <button 
                  className={styles.favoriteButton}
                  onClick={() => handleFavorite(beat.id)}
                >
                  <FaHeart />
                </button>
              </div>
            </div>

            <div className={styles.beatInfo}>
              <h3 className={styles.beatTitle}>{beat.title}</h3>
              <div className={styles.producerInfo}>
                <span className={styles.producerName}>{beat.producer}</span>
                {beat.isVerified && (
                  <BsCheckCircleFill className={styles.verifiedIcon} />
                )}
              </div>
              <div className={styles.beatActions}>
                <span className={styles.price}>${beat.price.toFixed(2)}</span>
                <button 
                  className={styles.cartButton}
                  onClick={() => handleAddToCart(beat.id)}
                >
                  <FaShoppingCart />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TrendingBeats;