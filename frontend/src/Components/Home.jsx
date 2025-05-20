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

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroBeats, setHeroBeats] = useState([]);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  // const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(new Audio());
  const { currentTrack, isPlaying, playTrack } = useAudio();
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
            coverImage: beat.coverImage || "https://via.placeholder.com/1200x600",
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
                coverImage: beat.coverImage || "https://via.placeholder.com/1200x600",
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
              coverImage: "https://via.placeholder.com/1200x600",
              audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
              price: 19.99,
              plays: 1200
            },
            // ... other fallback beats
          ]);
        }
      } catch (error) {
        console.error("Error fetching hero beats:", error);
        // Fallback data in case of error
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

    // Get audio URL with fallbacks
    let audioUrl = currentBeat.audioFile || currentBeat.audioUrl;

    // If no valid audio URL, use a fallback
    if (!audioUrl || audioUrl === "") {
      console.warn("No audio URL for this beat, using fallback");
      audioUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(currentBeatIndex % 5) + 1}.mp3`;
    }

    console.log(`Attempting to play audio: ${audioUrl}`);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setAudioLoading(true);

      // Reset previous handlers
      audio.oncanplaythrough = null;
      audio.onerror = null;
      audio.onended = null;

      // Set up error handling first
      audio.onerror = (e) => {
        console.error("Audio error:", e);
        console.error("Audio error code:", audio.error ? audio.error.code : "unknown");
        setAudioLoading(false);
        setIsPlaying(false);

        // Try a fallback if original URL fails
        if (!audioUrl.includes('soundhelix')) {
          const fallbackUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(currentBeatIndex % 5) + 1}.mp3`;
          console.log("Trying fallback URL:", fallbackUrl);

          // Create a new audio element for the fallback
          const fallbackAudio = new Audio(fallbackUrl);
          fallbackAudio.oncanplaythrough = () => {
            setAudioLoading(false);
            fallbackAudio.play()
              .then(() => {
                setIsPlaying(true);
                audioRef.current = fallbackAudio;
              })
              .catch(err => console.error("Fallback audio play error:", err));
          };

          fallbackAudio.onended = () => setIsPlaying(false);
          fallbackAudio.load();
        }
      };

      // Set canplaythrough handler
      audio.oncanplaythrough = () => {
        setAudioLoading(false);
        audio.play()
          .then(() => setIsPlaying(true))
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
      };

      // Set ended handler
      audio.onended = () => setIsPlaying(false);

      // Set the source and load the audio
      try {
        audio.src = audioUrl;
        audio.load();
      } catch (err) {
        console.error("Error loading audio:", err);
        setAudioLoading(false);
      }
    }
  };;

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