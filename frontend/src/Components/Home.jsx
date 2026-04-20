import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import BannerBackground from "../Assets/home-banner-background.png";
import { FaSearch, FaPlay, FaPause, FaChevronRight, FaChevronLeft } from "react-icons/fa";
import TrendingBeats from "./TrendingBeats";
import ProducersCarousel from "./ProducersCarousel";
import API from "../api/api";
import "../css/Home.css";
import { useAudio } from "../context/AudioContext";
import { useSettings } from "../context/SettingsContext";
import { getBeatId } from "../utils/audioUtils";

// ---------------------------------------------------------------------------
// Constants — easy to update without touching component logic
// ---------------------------------------------------------------------------

const CAROUSEL_INTERVAL_MS = 5000;

const HERO_BEAT_DEFAULTS = {
  audioFile: "",
  coverImage: "/default-cover.jpg",
  producer: { name: "Unknown Producer" },
};

const FALLBACK_BEATS = [
  {
    _id: "sample1",
    title: "Summer Vibes",
    producer: { name: "DJ Beats", verified: true },
    genre: "Trap",
    coverImage: "/default-cover.jpg",
    audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    price: 19.99,
    plays: 1200,
  },
  {
    _id: "sample2",
    title: "Midnight Feels",
    producer: { name: "Beat Master", verified: false },
    genre: "Hip-Hop",
    coverImage: "/default-cover.jpg",
    audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    price: 24.99,
    plays: 820,
  },
  {
    _id: "sample3",
    title: "Cloudy Dreams",
    producer: { name: "Cloud Beatz", verified: true },
    genre: "Lo-Fi",
    coverImage: "/default-cover.jpg",
    audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    price: 14.99,
    plays: 650,
  },
];

// Trending tags config — add/remove entries here without touching JSX
const TRENDING_TAGS = [
  { label: "pop",     value: "Pop",    isGenre: true },
  { label: "hip hop", value: "Hip-Hop", isGenre: true },
  { label: "trap",    value: "Trap",   isGenre: true },
  { label: "rnb",     value: "R&B",    isGenre: true },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a raw beat object so every field the UI needs is guaranteed. */
const normalizeBeat = (beat) => ({
  ...HERO_BEAT_DEFAULTS,
  ...beat,
  _id: beat._id || beat.id || `temp-${Math.random()}`,
  audioFile: beat.audioFile || beat.audioUrl || HERO_BEAT_DEFAULTS.audioFile,
  coverImage: beat.coverImage || HERO_BEAT_DEFAULTS.coverImage,
  producer: beat.producer || HERO_BEAT_DEFAULTS.producer,
});

// ---------------------------------------------------------------------------
// Sub-component: Carousel skeleton shown while loading
// ---------------------------------------------------------------------------

const HeroCarouselSkeleton = () => (
  <div className="hero-carousel hero-carousel--skeleton">
    <div className="hero-carousel-slide hero-carousel-slide--skeleton" />
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroBeats, setHeroBeats] = useState([]);
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0);
  const [heroLoading, setHeroLoading] = useState(true);
  const [heroError, setHeroError] = useState(null);

  const { playTrack, isBeatPlaying } = useAudio();
  const { settings } = useSettings();

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  useEffect(() => {
    const fetchHeroBeats = async () => {
      setHeroLoading(true);
      setHeroError(null);

      try {
        // 1. Try featured beats
        const featuredRes = await API.get("/api/beats/featured");
        const featuredData = featuredRes.data?.data;

        if (featuredData?.length > 0) {
          setHeroBeats(featuredData.map(normalizeBeat));
          return;
        }

        // 2. Fall back to trending beats
        const trendingRes = await API.get("/api/beats/trending");
        const trendingData = trendingRes.data?.data;

        if (trendingData?.length > 0) {
          setHeroBeats(trendingData.slice(0, 5).map(normalizeBeat));
          return;
        }

        // 3. Nothing from the API — use hardcoded samples
        setHeroBeats(FALLBACK_BEATS);
      } catch (error) {
        console.error("Error fetching hero beats:", error);
        setHeroError("Could not load featured beats.");
        setHeroBeats(FALLBACK_BEATS); // still show something
      } finally {
        setHeroLoading(false);
      }
    };

    fetchHeroBeats();
  }, []);

  // -------------------------------------------------------------------------
  // Auto-advance carousel (pauses while the current beat is playing)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (heroBeats.length === 0) return;

    const interval = setInterval(() => {
      // Read the current beat at interval tick, not via stale closure
      setCurrentBeatIndex((prev) => {
        const currentBeat = heroBeats[prev];
        if (currentBeat && isBeatPlaying(currentBeat)) return prev; // stay put
        return prev === heroBeats.length - 1 ? 0 : prev + 1;
      });
    }, CAROUSEL_INTERVAL_MS);

    return () => clearInterval(interval);
    // isBeatPlaying intentionally omitted — it is a stable context function;
    // including it would cause the interval to reset on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroBeats]);

  // -------------------------------------------------------------------------
  // Carousel controls
  // -------------------------------------------------------------------------

  const prevBeat = useCallback(() => {
    setCurrentBeatIndex((prev) =>
      prev === 0 ? heroBeats.length - 1 : prev - 1
    );
  }, [heroBeats.length]);

  const nextBeat = useCallback(() => {
    setCurrentBeatIndex((prev) =>
      prev === heroBeats.length - 1 ? 0 : prev + 1
    );
  }, [heroBeats.length]);

  // -------------------------------------------------------------------------
  // Playback
  // -------------------------------------------------------------------------

  const togglePlay = useCallback(() => {
    if (heroBeats.length === 0) return;
    const currentBeat = heroBeats[currentBeatIndex];
    playTrack(currentBeat);

    // Fire-and-forget play count — never block UI
    API.post(`/api/beats/${getBeatId(currentBeat)}/play`).catch(() => {});
  }, [heroBeats, currentBeatIndex, playTrack]);

  const isCurrentHeroBeatPlaying = heroBeats.length > 0
    ? isBeatPlaying(heroBeats[currentBeatIndex])
    : false;

  // -------------------------------------------------------------------------
  // Navigation helpers
  // -------------------------------------------------------------------------

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const q = searchQuery.trim();
      navigate(q ? `/BeatExplorePage?search=${encodeURIComponent(q)}` : "/BeatExplorePage");
    },
    [navigate, searchQuery]
  );

  const handleTagClick = useCallback(
    (value, isGenre) => {
      const param = isGenre ? "genre" : "search";
      navigate(`/BeatExplorePage?${param}=${encodeURIComponent(value)}`);
    },
    [navigate]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const currentBeat = heroBeats[currentBeatIndex];

  return (
    <div className="home-container">
      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="hero-container">
        <div className="hero-background">
          <img src={BannerBackground} alt="Background pattern" />
        </div>

        <div className="hero-content">
          {/* Left — text + search */}
          <div className="hero-left">
            <h1 className="hero-heading">
              {settings?.heroTitle || "YOUR FIRST HIT STARTS HERE"}
            </h1>

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

            <div className="trending-tags">
              <span className="trending-label">What&apos;s trending right now:</span>
              <div className="tags-container">
                {TRENDING_TAGS.map(({ label, value, isGenre }) => (
                  <span
                    key={label}
                    className="tag-item"
                    onClick={() => handleTagClick(value, isGenre)}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — carousel */}
          <div className="hero-right">
            {heroLoading ? (
              <HeroCarouselSkeleton />
            ) : heroBeats.length > 0 ? (
              <div className="hero-carousel">
                <div
                  className="hero-carousel-slide"
                  style={{
                    backgroundImage: `url(${currentBeat?.coverImage ?? "/default-cover.jpg"})`,
                  }}
                >
                  <div className="hero-carousel-content">
                    <button className="hero-play-button" onClick={togglePlay}>
                      {isCurrentHeroBeatPlaying ? <FaPause /> : <FaPlay />}
                    </button>

                    <div className="hero-beat-info">
                      <h3>{currentBeat?.title}</h3>
                      <p>
                        {currentBeat?.producer?.name ?? "Unknown Producer"}
                        {currentBeat?.producer?.verified && (
                          <span className="verified-badge">✓</span>
                        )}
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
                      className={`hero-indicator ${index === currentBeatIndex ? "active" : ""}`}
                      onClick={() => setCurrentBeatIndex(index)}
                    />
                  ))}
                </div>
              </div>
            ) : heroError ? (
              <p className="hero-error">{heroError}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Producers ───────────────────────────────────────────────────── */}
      <div className="producers-section">
        <ProducersCarousel />
      </div>

      {/* ── Trending Beats ──────────────────────────────────────────────── */}
      <div className="trending-beats-section">
        <TrendingBeats />
      </div>
    </div>
  );
};

export default Home;