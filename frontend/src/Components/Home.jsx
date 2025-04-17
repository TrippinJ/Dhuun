import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BannerBackground from "../Assets/home-banner-background.png";
import { FaSearch, FaPlay, FaPause, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import TrendingBeats from "./TrendingBeats";
import ProducersCarousel from "./ProducersCarousel";
import API from "../api/api";
import "../css/Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroBeats, setHeroBeats] = useState([]);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(new Audio());

  // Fetch featured beats for hero carousel
  useEffect(() => {
    const fetchHeroBeats = async () => {
      try {
        // Try to get beats from API
        const response = await API.get("/api/beats/featured");
        let beats = [];
        
        if (response.data && response.data.data && response.data.data.length > 0) {
          beats = response.data.data.slice(0, 5); // Get first 5 beats
        } else {
          // Fallback data if API doesn't return anything
          beats = [
            {
              _id: "sample1",
              title: "Summer Vibes",
              producer: { name: "DJ Beats", verified: true },
              genre: "Trap",
              coverImage: "https://via.placeholder.com/1200x600",
              audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              price: 19.99,
              plays: 1200
            },
            {
              _id: "sample2",
              title: "Midnight Feels",
              producer: { name: "Beat Master", verified: false },
              genre: "Hip-Hop",
              coverImage: "https://via.placeholder.com/1200x600",
              audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
              price: 24.99,
              plays: 820
            },
            {
              _id: "sample3",
              title: "Cloudy Dreams",
              producer: { name: "Cloud Beatz", verified: true },
              genre: "Lo-Fi",
              coverImage: "https://via.placeholder.com/1200x600",
              audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
              price: 14.99,
              plays: 650
            }
          ];
        }
        
        setHeroBeats(beats);
      } catch (error) {
        console.error("Error fetching hero beats:", error);
        
        // Set fallback data if API fails
        setHeroBeats([
          {
            _id: "sample1",
            title: "Summer Vibes",
            producer: { name: "DJ Beats", verified: true },
            genre: "Trap",
            coverImage: "https://via.placeholder.com/1200x600",
            audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            price: 19.99,
            plays: 1200
          },
          {
            _id: "sample2",
            title: "Midnight Feels",
            producer: { name: "Beat Master", verified: false },
            genre: "Hip-Hop",
            coverImage: "https://via.placeholder.com/1200x600",
            audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            price: 24.99,
            plays: 820
          },
          {
            _id: "sample3",
            title: "Cloudy Dreams",
            producer: { name: "Cloud Beatz", verified: true },
            genre: "Lo-Fi",
            coverImage: "https://via.placeholder.com/1200x600",
            audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            price: 14.99,
            plays: 650
          }
        ]);
      }
    };
    
    fetchHeroBeats();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) {
        setCurrentBeatIndex(prevIndex => 
          prevIndex === heroBeats.length - 1 ? 0 : prevIndex + 1
        );
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying, heroBeats.length]);

  // Handle audio playback
  useEffect(() => {
    const audio = audioRef.current;
    
    // Clean up on unmount
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Play/pause current beat
  const togglePlay = () => {
    const audio = audioRef.current;
    
    if (heroBeats.length === 0) return;
    
    const currentBeat = heroBeats[currentBeatIndex];
    const audioUrl = currentBeat.audioFile || currentBeat.audioUrl;
    
    if (!audioUrl) {
      console.error("No audio URL available for this beat");
      return;
    }
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setAudioLoading(true);
      
      // Set new audio source if needed
      if (audio.src !== audioUrl) {
        audio.src = audioUrl;
      }
      
      audio.oncanplaythrough = () => {
        setAudioLoading(false);
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
      };
      
      audio.onerror = () => {
        console.error("Audio error");
        setAudioLoading(false);
        setIsPlaying(false);
      };
      
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      // Force load even if the URL hasn't changed
      audio.load();
    }
  };

  // Navigate to previous beat
  const prevBeat = () => {
    // Stop current playback
    audioRef.current.pause();
    setIsPlaying(false);
    
    setCurrentBeatIndex(prevIndex => 
      prevIndex === 0 ? heroBeats.length - 1 : prevIndex - 1
    );
  };

  // Navigate to next beat
  const nextBeat = () => {
    // Stop current playback
    audioRef.current.pause();
    setIsPlaying(false);
    
    setCurrentBeatIndex(prevIndex => 
      prevIndex === heroBeats.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/BeatExplorePage?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="home-container">
      {/* Hero Banner with Search and Carousel */}
      <div className="hero-container">
        <div className="hero-background">
          <img src={BannerBackground} alt="Background pattern" />
        </div>
        
        <div className="hero-content">
          {/* Left Section with Text and Search */}
          <div className="hero-left">
            <h1 className="hero-heading">YOUR FIRST HIT STARTS HERE</h1>
            
            {/* BeatStars-style search bar */}
            <div className="hero-search-container">
              <form onSubmit={handleSearch} className="hero-search-form">
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Try searching Trap or Sad or Juice Wrld..."
                    className="hero-search-input"
                  />
                </div>
                <button type="submit" className="hero-search-button">
                  Search
                </button>
              </form>
            </div>
            
            {/* Trending tags */}
            <div className="trending-tags">
              <span className="trending-label">What's trending right now:</span>
              <div className="tags-container">
                <span className="tag-item" onClick={() => navigate("/BeatExplorePage?genre=pop")}>pop</span>
                <span className="tag-item" onClick={() => navigate("/BeatExplorePage?genre=hip%20hop")}>hip hop</span>
                <span className="tag-item" onClick={() => navigate("/BeatExplorePage?genre=trap")}>trap</span>
                <span className="tag-item" onClick={() => navigate("/BeatExplorePage?search=juice%20wrld")}>juice wrld</span>
              </div>
            </div>
          </div>
          
          {/* Right Section with Carousel */}
          <div className="hero-right">
            {heroBeats.length > 0 && (
              <div className="hero-carousel">
                <div 
                  className="hero-carousel-slide"
                  style={{ backgroundImage: `url(${heroBeats[currentBeatIndex].coverImage || "https://via.placeholder.com/1200x600"})` }}
                >
                  <div className="hero-carousel-content">
                    <button 
                      className="hero-play-button"
                      onClick={togglePlay}
                    >
                      {audioLoading ? (
                        <div className="loading-spinner"></div>
                      ) : isPlaying ? (
                        <FaPause />
                      ) : (
                        <FaPlay />
                      )}
                    </button>
                    
                    <div className="hero-beat-info">
                      <h3>{heroBeats[currentBeatIndex].title}</h3>
                      <p>
                        {heroBeats[currentBeatIndex].producer?.name || "Unknown Producer"}
                        {heroBeats[currentBeatIndex].producer?.verified && <span className="verified-badge">✓</span>}
                      </p>
                    </div>
                  </div>
                  
                  <button className="hero-nav-button prev" onClick={prevBeat}>
                    <FaChevronLeft />
                  </button>
                  <button className="hero-nav-button next" onClick={nextBeat}>
                    <FaChevronRight />
                  </button>
                </div>
                
                <div className="hero-carousel-indicators">
                  {heroBeats.map((_, index) => (
                    <button
                      key={index}
                      className={`hero-indicator ${index === currentBeatIndex ? 'active' : ''}`}
                      onClick={() => {
                        audioRef.current.pause();
                        setIsPlaying(false);
                        setCurrentBeatIndex(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Featured Producers Carousel */}
      <div className="producers-section">
        <ProducersCarousel />
      </div>
      
      {/* Trending Beats Section */}
      <div className="trending-beats-section">
        <TrendingBeats />
      </div>
    </div>
  );
};

export default Home;