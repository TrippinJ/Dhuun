import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlay, FaPause, FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from '../css/FeaturedBeatsCarousel.module.css';

const FeaturedBeatsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const audioRef = useRef(new Audio());
  
  // Sample featured beats data
  const featuredBeats = [
    {
      id: 1,
      title: "Summer Vibes",
      producer: "DJ Beats",
      image: "https://via.placeholder.com/300x160",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      price: 19.99
    },
    {
      id: 2,
      title: "Trap Nation",
      producer: "Beat Maestro",
      image: "https://via.placeholder.com/300x160",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      price: 24.99
    },
    {
      id: 3,
      title: "Lo-Fi Dreams",
      producer: "Chill Wave",
      image: "https://via.placeholder.com/300x160",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      price: 14.99
    }
  ];
  
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredBeats.length - 1 ? 0 : prevIndex + 1
    );
  }, [featuredBeats.length]);
  
  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredBeats.length - 1 : prevIndex - 1
    );
  }, [featuredBeats.length]);
  
  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [nextSlide]);
  
  // Handle audio playback
  const togglePlay = (beatId, audioUrl) => {
    const audio = audioRef.current;
    
    // If the same beat is clicked
    if (beatId === currentPlayingId) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        audio.play();
        setIsPlaying(true);
      }
    } 
    // If a different beat is clicked
    else {
      if (isPlaying) {
        audio.pause();
      }
      audio.src = audioUrl;
      audio.play();
      setCurrentPlayingId(beatId);
      setIsPlaying(true);
    }
  };
  
  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);
  
  // Handle buy now click
  const handleBuyNow = (beatId) => {
    // Here you would add the logic to add the beat to cart or navigate to purchase page
    console.log('Buy now clicked for beat ID:', beatId);
    // For example: navigate(`/beat/${beatId}/purchase`);
  };
  
  return (
    <div className={styles.carouselContainer}>
      <h2 className={styles.carouselTitle}>Featured Beats</h2>
      
      <div className={styles.carousel}>
        <button className={`${styles.carouselButton} ${styles.prevButton}`} onClick={prevSlide}>
          <FaChevronLeft />
        </button>
        
        <div className={styles.carouselTrack} style={{transform: `translateX(-${currentIndex * 100}%)`}}>
          {featuredBeats.map((beat) => (
            <div className={styles.carouselSlide} key={beat.id}>
              <div className={styles.beatCard}>
                <div className={styles.imageContainer}>
                  <img src={beat.image} alt={beat.title} />
                  <button 
                    className={styles.playButton}
                    onClick={() => togglePlay(beat.id, beat.audioUrl)}
                  >
                    {isPlaying && currentPlayingId === beat.id ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
                <h3>{beat.title}</h3>
                <p className={styles.producer}>{beat.producer}</p>
                <div className={styles.priceRow}>
                  <span className={styles.price}>${beat.price.toFixed(2)}</span>
                  <button 
                    className={styles.buyButton}
                    onClick={() => handleBuyNow(beat.id)}
                  >
                    <FaShoppingCart /> Buy Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className={`${styles.carouselButton} ${styles.nextButton}`} onClick={nextSlide}>
          <FaChevronRight />
        </button>
      </div>
      
      <div className={styles.indicators}>
        {featuredBeats.map((_, index) => (
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

export default FeaturedBeatsCarousel;