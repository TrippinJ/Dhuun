import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlay, FaPause, FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from '../css/FeaturedBeatsCarousel.module.css';

const FeaturedBeatsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
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
  
  // Handle audio playback with improved error handling
  const togglePlay = (beatId, audioUrl) => {
    try {
      const audio = audioRef.current;
      
      console.log(`Toggling play for beat ID: ${beatId}, URL: ${audioUrl}`);
      
      if (!audioUrl) {
        console.error("No audio URL provided for this beat");
        return;
      }
      
      // If the same beat is clicked
      if (beatId === currentPlayingId) {
        if (isPlaying) {
          audio.pause();
          setIsPlaying(false);
        } else {
          audio.play()
            .catch(error => {
              console.error("Error resuming audio:", error);
              setIsPlaying(false);
            });
          setIsPlaying(true);
        }
        return;
      } 
      
      // If a different beat is clicked
      if (isPlaying) {
        audio.pause();
      }
      
      // Set loading state
      setAudioLoading(true);
      
      // Set audio source and prepare event handlers
      audio.src = audioUrl;
      
      // Set up event handlers
      audio.oncanplaythrough = () => {
        setAudioLoading(false);
        audio.play()
          .then(() => {
            setCurrentPlayingId(beatId);
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            setAudioLoading(false);
            setIsPlaying(false);
          });
      };
      
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };
      
      audio.onerror = (e) => {
        console.error("Audio error:", e);
        console.error("Error code:", audio.error ? audio.error.code : "unknown");
        setAudioLoading(false);
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };
      
    } catch (error) {
      console.error("Error in togglePlay:", error);
      setAudioLoading(false);
      setIsPlaying(false);
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
    // Get the beat from the array
    const beat = featuredBeats.find(b => b.id === beatId);
    if (!beat) return;
    
    // Get existing cart or initialize empty array
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (error) {
      console.error("Error parsing cart:", error);
      cart = [];
    }
    
    // Check if beat is already in cart
    const beatInCart = cart.some(item => item.id === beatId);
    
    if (beatInCart) {
      alert(`"${beat.title}" is already in your cart`);
      return;
    }
    
    // Add beat to cart
    cart.push(beat);
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show feedback to user
    alert(`${beat.title} added to cart!`);
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
                  <img 
                    src={beat.image} 
                    alt={beat.title} 
                    onError={(e) => {
                      console.log("Image error, using fallback");
                      e.target.src = "https://via.placeholder.com/300x160";
                    }}
                  />
                  <button 
                    className={styles.playButton}
                    onClick={() => togglePlay(beat.id, beat.audioUrl)}
                    disabled={audioLoading && currentPlayingId === beat.id}
                  >
                    {audioLoading && currentPlayingId === beat.id ? (
                      <span>...</span>
                    ) : isPlaying && currentPlayingId === beat.id ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )}
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