import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import styles from '../css/TrendingBeats.module.css';
import API from '../api/api';

const TrendingBeats = () => {
  const [trendingBeats, setTrendingBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(new Audio());
  
  // Fetch trending beats from API
  useEffect(() => {
    const fetchTrendingBeats = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/beats/trending');
        
        // Log the complete response structure
        console.log('Complete API response:', response);
        
        const beatsData = response.data.data || [];
        
        // Check if we have valid audio URLs in the response
        const hasValidAudioUrls = beatsData.some(beat => beat.audioFile || beat.audioUrl || beat.audio);
        
        if (beatsData.length > 0 && !hasValidAudioUrls) {
          console.warn("Beats data found, but no valid audio URLs detected");
        }
        
        // Add working audio URLs to beats that don't have them
        const enhancedBeats = beatsData.map(beat => {
          if (!beat.audioFile && !beat.audioUrl && !beat.audio) {
            return {
              ...beat,
              audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 10) + 1}.mp3`
            };
          }
          return beat;
        });
        
        setTrendingBeats(enhancedBeats.length > 0 ? enhancedBeats : [
          // Fallback test beats with guaranteed working URLs
          {
            _id: "sample1",
            title: "Never Give Up",
            producer: { name: "TrippinJ", verified: true },
            coverImage: "https://via.placeholder.com/300x300",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            price: 19.99
          },
          {
            _id: "sample2",
            title: "Trap Nation",
            producer: { name: "Beat Master", verified: false },
            coverImage: "https://via.placeholder.com/300x300",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            price: 24.99
          }
        ]);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trending beats:', err);
        setError('Failed to load trending beats');
        setLoading(false);
        
        // Set fallback data when API fails
        setTrendingBeats([
          {
            _id: "sample1",
            title: "Summer Vibes",
            producer: { name: "DJ Beats", verified: true },
            coverImage: "https://via.placeholder.com/300x300",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            price: 19.99
          },
          {
            _id: "sample2",
            title: "Trap Nation",
            producer: { name: "Beat Master", verified: false },
            coverImage: "https://via.placeholder.com/300x300",
            audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            price: 24.99
          }
        ]);
      }
    };
    
    fetchTrendingBeats();
    
    // Cleanup
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // Handle play button click
  const handlePlay = (beat) => {
    try {
      const beatId = beat._id;
      // Check ALL possible audio URL properties
      const audioUrl = beat.audioFile || beat.audioUrl || beat.audio;
      
      console.log("Beat details:", {
        id: beatId,
        audioFile: beat.audioFile, 
        audioUrl: beat.audioUrl,
        audio: beat.audio
      });
      
      // If no audio URL is found, try a fallback URL format
      if (!audioUrl) {
        console.error("No audio URL found for this beat - attempting to construct one");
        // Try constructing a URL based on the beat ID pattern you see in console
        const fallbackUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`;
        console.log("Using fallback URL:", fallbackUrl);
        
        // Use the fallback URL
        playAudio(beatId, fallbackUrl);
        return;
      }
      
      console.log(`Playing beat ${beatId}, URL: ${audioUrl}`);
      playAudio(beatId, audioUrl);
    } catch (error) {
      console.error("Error in handlePlay:", error);
      setAudioLoading(false);
    }
  };
  
  // Create a separate function for the actual audio playback
  const playAudio = (beatId, audioUrl) => {
    const audio = audioRef.current;
    
    // If already playing this beat, toggle pause
    if (currentlyPlaying === beatId) {
      if (!audio.paused) {
        audio.pause();
        setCurrentlyPlaying(null);
      } else {
        audio.play()
          .catch(error => console.error("Error resuming audio:", error));
        setCurrentlyPlaying(beatId);
      }
      return;
    }
    
    // Stop current audio if different beat is playing
    if (currentlyPlaying) {
      audio.pause();
    }
    
    // Set new audio source
    setAudioLoading(true);
    audio.src = audioUrl;
    
    // Add event listener for errors to see detailed error information
    audio.addEventListener('error', (e) => {
      console.error("Audio error event:", e);
      console.error("Audio error details:", {
        code: audio.error?.code,
        message: audio.error?.message,
        URL: audioUrl
      });
      setAudioLoading(false);
      setCurrentlyPlaying(null);
    }, { once: true });
    
    // Handle events
    audio.oncanplaythrough = () => {
      console.log("Audio can play through now");
      setAudioLoading(false);
      audio.play()
        .then(() => {
          console.log("Audio playback started successfully");
          setCurrentlyPlaying(beatId);
          
          // Try to increment play count via API
          try {
            API.post(`/api/beats/${beatId}/play`).catch(err => {
              console.log("Could not update play count, ignoring:", err);
            });
          } catch (e) {
            // Silently ignore tracking errors
          }
        })
        .catch(error => {
          console.error("Error playing audio:", error);
          setAudioLoading(false);
          setCurrentlyPlaying(null);
        });
    };
    
    audio.onended = () => {
      setCurrentlyPlaying(null);
    };
  };

  // Handle add to cart
  const handleAddToCart = (beat) => {
    console.log(`Add beat ${beat._id} to cart`);
    
    // Get existing cart or initialize empty array
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cart') || '[]');
    } catch (error) {
      console.error("Error parsing cart:", error);
      cart = [];
    }
    
    // Check if beat is already in cart
    const beatInCart = cart.some(item => item._id === beat._id);
    
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

  // Handle favorite
  const handleFavorite = (id) => {
    console.log(`Add beat ${id} to favorites`);
    // Implement favorites functionality
    alert("Favorite feature coming soon!");
  };

  // Handle see more click
  const handleSeeMore = () => {
    console.log('See more beats');
    window.location.href = '/BeatExplorePage';
  };

  if (loading) {
    return <div className={styles.loading}>Loading trending beats...</div>;
  }

  if (error && trendingBeats.length === 0) {
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
                <img 
                  src={beat.coverImage || "https://via.placeholder.com/300x300"} 
                  alt={beat.title} 
                  className={styles.beatImage}
                  onError={(e) => {
                    console.log("Image error, using fallback");
                    e.target.src = "https://via.placeholder.com/300x300";
                  }}
                />
                <div className={styles.imageOverlay}>
                  <button 
                    className={styles.playButton}
                    onClick={() => handlePlay(beat)}
                    disabled={audioLoading && currentlyPlaying === beat._id}
                  >
                    {audioLoading && currentlyPlaying === beat._id ? (
                      <span>...</span>
                    ) : currentlyPlaying === beat._id ? (
                      <FaPause />
                    ) : (
                      <FaPlay />
                    )}
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