import React, { useState, useEffect, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaCheckCircle } from 'react-icons/fa';
import styles from '../css/ProducersCarousel.module.css';
import API from '../api/api';

const ProducersCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calculate number of producers to show based on responsive design
  const getVisibleCount = () => {
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 900) return 2;
    if (window.innerWidth < 1200) return 3;
    return 4;
  };
  
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());
  
  // Fetch featured producers from API
  useEffect(() => {
    const fetchProducers = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/producers/featured');
        setProducers(response.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching producers:', err);
        setError('Failed to load featured producers');
        setLoading(false);
        
        // Set some placeholder data if API fails
        setProducers([
          {
            id: 1,
            name: "DJ Beats",
            image: "https://via.placeholder.com/150",
            verified: true,
            followers: "12.5K",
            beats: 48
          },
          {
            id: 2,
            name: "BeatMaster Pro",
            image: "https://via.placeholder.com/150",
            verified: true,
            followers: "45K",
            beats: 124
          },
          {
            id: 3,
            name: "Melody Maker",
            image: "https://via.placeholder.com/150",
            verified: false,
            followers: "8.2K",
            beats: 37
          }
        ]);
      }
    };
    
    fetchProducers();
  }, []);
  
  // Update visible count on window resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const nextSlide = useCallback(() => {
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      return nextIndex >= producers.length - visibleCount + 1 ? 0 : nextIndex;
    });
  }, [producers.length, visibleCount]);
  
  const prevSlide = useCallback(() => {
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex - 1;
      return nextIndex < 0 ? producers.length - visibleCount : nextIndex;
    });
  }, [producers.length, visibleCount]);
  
  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [nextSlide]);
  
  // Handle producer click - navigate to producer page
  const handleProducerClick = (producerId) => {
    // Navigate to producer page or show profile
    console.log(`Navigate to producer ${producerId}`);
    window.location.href = `/producer/${producerId}`;
  };
  
  // Handle follow button click
  const handleFollow = (e, producerId) => {
    e.stopPropagation(); // Prevent triggering the card click
    console.log(`Follow producer ${producerId}`);
    // Implement follow functionality
  };
  
  if (loading) {
    return <div className={styles.loading}>Loading featured producers...</div>;
  }
  
  if (error && producers.length === 0) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.carouselHeader}>
        <h2 className={styles.carouselTitle}>Featured Producers</h2>
      </div>
      
      <div className={styles.carouselWrapper}>
        <button 
          className={`${styles.carouselButton} ${styles.prevButton}`}
          onClick={prevSlide}
        >
          <FaChevronLeft />
        </button>
        
        <div className={styles.carouselTrack}>
          <div 
            className={styles.carouselInner}
            style={{ 
              transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              gridTemplateColumns: `repeat(${producers.length}, ${100 / visibleCount}%)`
            }}
          >
            {producers.map((producer) => (
              <div 
                key={producer.id || producer._id} 
                className={styles.producerCard}
                onClick={() => handleProducerClick(producer.id || producer._id)}
              >
                <div className={styles.producerImageContainer}>
                  <img 
                    src={producer.image || producer.avatar || "https://via.placeholder.com/150"} 
                    alt={producer.name} 
                    className={styles.producerImage} 
                  />
                  {producer.verified && (
                    <span className={styles.verifiedBadge}>
                      <FaCheckCircle />
                    </span>
                  )}
                </div>
                <h3 className={styles.producerName}>{producer.name}</h3>
                <div className={styles.producerStats}>
                  <span>{producer.followers || "0"} followers</span>
                  <span>{producer.beats || "0"} beats</span>
                </div>
                <button 
                  className={styles.followButton}
                  onClick={(e) => handleFollow(e, producer.id || producer._id)}
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          className={`${styles.carouselButton} ${styles.nextButton}`}
          onClick={nextSlide}
        >
          <FaChevronRight />
        </button>
      </div>
      
      <div className={styles.carouselIndicators}>
        {Array.from({ length: producers.length - visibleCount + 1 }).map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${index === currentIndex ? styles.active : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProducersCarousel;