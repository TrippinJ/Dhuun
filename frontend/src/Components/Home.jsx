import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BannerBackground from "../Assets/home-banner-background.png";
import { FaSearch, FaPlay, FaPause, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import TrendingBeats from "./TrendingBeats";
import ProducersCarousel from "./ProducersCarousel";
import API from "../api/api";
import "../css/Home.css";
import { useAudio } from "../context/AudioContext"; 
import { useSettings } from '../context/SettingsContext';
import { getBeatId } from '../utils/audioUtils';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroBeats, setHeroBeats] = useState([]);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  
  // Use global audio context instead of local audio ref
  const { currentTrack, isPlaying, playTrack, isBeatPlaying } = useAudio();
  const { settings } = useSettings();

  // In the useEffect for fetching hero beats
  useEffect(() => {
    const fetchHeroBeats = async () => {
      try {
        console.log("Fetching featured beats for hero section...");
        const response = await API.get("/api/beats/featured");

        console.log("Featured beats response:", response.data);

        // Check if we have featured beats
        if (response.data?.data && response.data.data.length > 0) {
          const processedBeats = response.data.data.map(beat => ({
            ...beat,
            // Ensure required properties exist
            _id: beat._id || beat.id || `temp-${Math.random()}`,
            audioFile: beat.audioFile || beat.audioUrl || "",
            coverImage: beat.coverImage || "/default-cover.jpg",
            producer: beat.producer || { name: "Unknown Producer" }
          }));

          setHeroBeats(processedBeats);
          console.log("Successfully set hero beats from API:", processedBeats);
        } else {
          console.log("No featured beats found in API response, using fallback data");

          // Try to get trending beats as a fallback
          try {
            const trendingResponse = await API.get("/api/beats/trending");
            if (trendingResponse.data?.data && trendingResponse.data.data.length > 0) {
              const processedTrendingBeats = trendingResponse.data.data.slice(0, 5).map(beat => ({
                ...beat,
                _id: beat._id || beat.id || `temp-${Math.random()}`,
                audioFile: beat.audioFile || beat.audioUrl || "",
                coverImage: beat.coverImage || "/default-cover.jpg",
                producer: beat.producer || { name: "Unknown Producer" }
              }));

              setHeroBeats(processedTrendingBeats);
              console.log("Set hero beats from trending instead:", processedTrendingBeats);
              return;
            }
          } catch (trendingError) {
            console.error("Error fetching trending beats as fallback:", trendingError);
          }

          // If both featured and trending fail, fallback to hardcoded data
          setHeroBeats([
            {
              _id: "sample1",
              title: "Summer Vibes",
              producer: { name: "DJ Beats", verified: true },
              genre: "Trap",
              coverImage: "/default-cover.jpg",
              audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              price: 19.99,
              plays: 1200
            },
            {
              _id: "sample2",
              title: "Midnight Feels",
              producer: { name: "Beat Master", verified: false },
              genre: "Hip-Hop",
              coverImage: "/default-cover.jpg",
              audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
              price: 24.99,
              plays: 820
            },
            {
              _id: "sample3",
              title: "Cloudy Dreams",
              producer: { name: "Cloud Beatz", verified: true },
              genre: "Lo-Fi",
              coverImage: "/default-cover.jpg",
              audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
              price: 14.99,
              plays: 650
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching hero beats:", error);
        // Fallback data in case of error
        setHeroBeats([
          {
            _id: "sample1",
            title: "Summer Vibes",
            producer: { name: "DJ Beats", verified: true },
            genre: "Trap",
            coverImage: "/default-cover.jpg",
            audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            price: 19.99,
            plays: 1200
          }
        ]);
      }
    };

    fetchHeroBeats();
  }, []);

  // Auto-advance carousel only when not playing current beat
  useEffect(() => {
    const interval = setInterval(() => {
      const currentBeat = heroBeats[currentBeatIndex];
      const isCurrentBeatPlaying = currentBeat && isBeatPlaying(currentBeat);
      
      if (!isCurrentBeatPlaying) {
        setCurrentBeatIndex(prevIndex =>
          prevIndex === heroBeats.length - 1 ? 0 : prevIndex + 1
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [heroBeats.length, currentBeatIndex, isBeatPlaying]);

  // Play/pause current beat using global audio context
  const togglePlay = () => {
    if (heroBeats.length === 0) return;

    const currentBeat = heroBeats[currentBeatIndex];
    
    console.log('Home togglePlay - currentBeat:', getBeatId(currentBeat));
    console.log('Home togglePlay - is this beat playing:', isBeatPlaying(currentBeat));
    
    // Use the global audio context
    playTrack(currentBeat);

    // Track play count
    try {
      API.post(`/api/beats/${getBeatId(currentBeat)}/play`).catch(err => {
        console.log("Could not update play count:", err);
      });
    } catch (error) {
      // Silently ignore tracking errors
    }
  };

  // Navigate to previous beat
  const prevBeat = () => {
    setCurrentBeatIndex(prevIndex =>
      prevIndex === 0 ? heroBeats.length - 1 : prevIndex - 1
    );
  };

  // Navigate to next beat
  const nextBeat = () => {
    setCurrentBeatIndex(prevIndex =>
      prevIndex === heroBeats.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Handle search submission with proper URL parameters
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate with search query parameter
      navigate(`/BeatExplorePage?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If no search term, just go to explore page
      navigate('/BeatExplorePage');
    }
  };

  // Handle trending tag clicks with proper navigation
  const handleTagClick = (tag, isGenre = false) => {
    if (isGenre) {
      // For genre filtering, capitalize first letter to match your genre options
      const formattedGenre = tag.charAt(0).toUpperCase() + tag.slice(1);
      navigate(`/BeatExplorePage?genre=${encodeURIComponent(formattedGenre)}`);
    } else {
      navigate(`/BeatExplorePage?search=${encodeURIComponent(tag)}`);
    }
  };

  // Check if current hero beat is playing
  const isCurrentHeroBeatPlaying = () => {
    if (heroBeats.length === 0) return false;
    const currentBeat = heroBeats[currentBeatIndex];
    return isBeatPlaying(currentBeat);
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
            <h1 className="hero-heading">{settings.heroTitle || "YOUR FIRST HIT STARTS HERE"}</h1>

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

            {/* Trending tags with proper navigation */}
            <div className="trending-tags">
              <span className="trending-label">What's trending right now:</span>
              <div className="tags-container">
                <span className="tag-item" onClick={() => handleTagClick("Pop", true)}>pop</span>
                <span className="tag-item" onClick={() => handleTagClick("Hip-Hop", true)}>hip hop</span>
                <span className="tag-item" onClick={() => handleTagClick("Trap", true)}>trap</span>
                <span className="tag-item" onClick={() => handleTagClick("R&B", true)}>rnb</span>
              </div>
            </div>
          </div>

          {/* Right Section with Carousel */}
          <div className="hero-right">
            {heroBeats.length > 0 && (
              <div className="hero-carousel">
                <div
                  className="hero-carousel-slide"
                  style={{ backgroundImage: `url(${heroBeats[currentBeatIndex].coverImage || "/default-cover.jpg"})` }}
                >
                  <div className="hero-carousel-content">
                    <button
                      className="hero-play-button"
                      onClick={togglePlay}
                    >
                      {audioLoading ? (
                        <div className="loading-spinner"></div>
                      ) : isCurrentHeroBeatPlaying() ? (
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