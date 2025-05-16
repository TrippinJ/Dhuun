// src/Components/TrendingBeats.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaHeart, FaShoppingCart } from 'react-icons/fa';
import { BsCheckCircleFill } from 'react-icons/bs';
import styles from '../css/TrendingBeats.module.css';
import API from '../api/api';
import { useAudio } from '../context/AudioContext';
import { useNavigate } from 'react-router-dom';
import { useLicense } from '../context/LicenseContext';

const TrendingBeats = () => {
  const [trendingBeats, setTrendingBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const navigate = useNavigate();
  const { openLicenseModal } = useLicense();

  // Use the audio context
  const { playTrack, currentTrack, isPlaying } = useAudio();
  
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
  }, []);

  // Handle play button click - now uses the global audio context
  const handlePlay = (beat) => {
    try {
      // Check ALL possible audio URL properties
      const audioUrl = beat.audioFile || beat.audioUrl || beat.audio;
      
      // If no audio URL is found, add a fallback URL
      if (!audioUrl) {
        console.error("No audio URL found for this beat - using fallback");
        // Add fallback URL to the beat object
        beat = {
          ...beat,
          audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`
        };
      }
      
      // Use the AudioContext's playTrack function
      playTrack(beat);
      
      // Try to increment play count via API
      try {
        API.post(`/api/beats/${beat._id}/play`).catch(err => {
          console.log("Could not update play count, ignoring:", err);
        });
      } catch (e) {
        // Silently ignore tracking errors
      }
    } catch (error) {
      console.error("Error in handlePlay:", error);
    }
  };

  // Handle add to cart
  const handleAddToCart = (beat) => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }
    
    openLicenseModal(beat, (beatWithLicense) => {
      try {
        // Get existing cart
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Check if beat is already in cart with same license
        const beatInCart = cart.some(item => 
          item._id === beatWithLicense._id && 
          item.selectedLicense === beatWithLicense.selectedLicense
        );
        
        if (beatInCart) {
          alert(`"${beatWithLicense.title}" with ${beatWithLicense.licenseName} is already in your cart`);
          return;
        }
        
        // Add beat to cart
        cart.push(beatWithLicense);
        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`${beatWithLicense.title} with ${beatWithLicense.licenseName} added to cart!`);
      } catch (error) {
        console.error("Error adding to cart:", error);
        alert("Error adding to cart. Please try again.");
      }
    });
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
    navigate('/BeatExplorePage');
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
          trendingBeats.map((beat) => {
            // Check if this beat is currently playing
            const isThisPlaying = 
              isPlaying && 
              currentTrack && 
              (currentTrack._id === beat._id || currentTrack.id === beat.id);
              
            return (
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
                      disabled={audioLoading && currentTrack?._id === beat._id}
                    >
                      {audioLoading && currentTrack?._id === beat._id ? (
                        <span>...</span>
                      ) : isThisPlaying ? (
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
                    <span className={styles.price}>Rs {beat.price?.toFixed(2) || "0.00"}</span>
                    <button 
                      className={styles.cartButton}
                      onClick={() => handleAddToCart(beat)}
                    >
                      <FaShoppingCart />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.noBeats}>No trending beats available</div>
        )}
      </div>
    </>
  );
};

export default TrendingBeats;