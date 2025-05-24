// src/pages/BeatExplorePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/BeatExplorePage.module.css";
import {
  FaCartPlus,
  FaPlay,
  FaSearch,
  FaHeart,
  FaPause,
  FaListUl,
  FaThLarge,
  FaInfoCircle,
  FaFilter,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import SingleBeatModal from '../Components/Singlebeatmodal';
import { useAudio } from '../context/AudioContext';
import LicenseSelectionModal from '../Components/LicenseSelectionModal';
import ProducerProfile from '../Components/ProducerProfile';
import { getBeatId } from '../utils/audioUtils';

const BeatExplorePage = () => {
  // State variables
  const [beats, setBeats] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [priceRange, setPriceRange] = useState(100);
  const [maxPrice, setMaxPrice] = useState(100);
  const [cartItems, setCartItems] = useState([]);
  const [displayMode, setDisplayMode] = useState("grid");
  const [selectedBeat, setSelectedBeat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedBeatForLicense, setSelectedBeatForLicense] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [displayedBeats, setDisplayedBeats] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const itemsPerLoad = 12;

  // Producer Profile
  const [showProducerProfile, setShowProducerProfile] = useState(false);
  const [selectedProducerId, setSelectedProducerId] = useState(null);

  // FIXED: Single useAudio destructuring with all needed values
  const { playTrack, isBeatPlaying, currentTrack, isPlaying } = useAudio();

  const navigate = useNavigate();

  // Available genres
  const genres = [
    "All Genres",
    "Trap",
    "Hip-Hop",
    "R&B",
    "Pop",
    "Drill",
    "Lo-Fi",
    "Future"
  ];

  // Function to initiate producer profile
  const handleOpenProducerProfile = (producerId) => {
    setSelectedProducerId(producerId);
    setShowProducerProfile(true);
  };

  // Fetch beats from API
  useEffect(() => {
    const fetchBeats = async () => {
      try {
        setLoading(true);
        const response = await API.get("/api/beats");
        console.log("API Response:", response.data);

        if (response.data && response.data.data) {
          setBeats(response.data.data);
        } else if (Array.isArray(response.data)) {
          setBeats(response.data);
        } else {
          setBeats([]);
          setErrorMessage("No beats data available");
        }
      } catch (error) {
        console.error("Failed to fetch beats:", error);
        setErrorMessage("Error fetching beats. Please try again later.");

        // Fallback data for development
        setBeats([
          {
            _id: "sample1",
            title: "Summer Vibes",
            producer: { name: "DJ Beats", verified: true },
            genre: "Trap",
            coverImage: "/default-cover.jpg",
            audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            price: 19.99,
            plays: 1200,
            likes: 356
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
            likes: 215
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
            likes: 120
          },
          {
            _id: "sample4",
            title: "City Nights",
            producer: { name: "Urban Producer", verified: true },
            genre: "R&B",
            coverImage: "/default-cover.jpg",
            audioFile: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
            price: 29.99,
            plays: 1500,
            likes: 412
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBeats();

    // Load wishlist from localStorage
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(savedWishlist);
    } catch (error) {
      console.error('Error loading wishlist:', error);
    }

    // Load cart from localStorage
    try {
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(savedCart);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Fetch popular tags
  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const response = await API.get('/api/beats/tags/popular');
        if (response.data.success) {
          setAvailableTags(response.data.data.slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchPopularTags();
  }, []);

  // Set max price after beats are loaded
  useEffect(() => {
    if (beats && beats.length > 0) {
      const prices = beats.map(beat => beat.price || 0);
      const max = Math.max(...prices);
      setMaxPrice(max > 0 ? max : 100);
      setPriceRange(max > 0 ? max : 100);
    }
  }, [beats]);

  // Filter functions
  const filterBeats = () => {
    return beats.filter(beat => {
      const keywordMatch = !keywords.trim() ||
        beat.title?.toLowerCase().includes(keywords.toLowerCase()) ||
        beat.producer?.name?.toLowerCase().includes(keywords.toLowerCase());

      const genreMatch = selectedGenre === "All Genres" ||
        beat.genre?.toLowerCase() === selectedGenre.toLowerCase();

      const priceMatch = !beat.price || beat.price <= priceRange;

      const tagsMatch = selectedTags.length === 0 ||
        selectedTags.some(selectedTag =>
          beat.tags?.some(beatTag =>
            beatTag.toLowerCase().includes(selectedTag.toLowerCase())
          )
        );

      return keywordMatch && genreMatch && priceMatch && tagsMatch;
    });
  };

  // Tags toggle function
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleProducerClick = (e, producerId) => {
    e.stopPropagation();
    e.preventDefault();
    handleOpenProducerProfile(producerId);
  };

  // FIXED: Simplified play preview handler
  const handlePlayPreview = (event, beat) => {
    event.stopPropagation();

    try {
      console.log('BeatExplorePage play clicked for beat:', getBeatId(beat));
      playTrack(beat);

      // Optionally increment play count via API
      try {
        API.post(`/api/beats/${getBeatId(beat)}/play`).catch(err => {
          console.log("Could not update play count, ignoring:", err);
        });
      } catch (error) {
        // Silently ignore tracking errors
      }
    } catch (error) {
      console.error("Audio playback error:", error);
    }
  };

  // Handle adding to cart
  const handleAddToCart = (event, beat) => {
    event.stopPropagation();

    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to cart");
      navigate("/login");
      return;
    }

    setSelectedBeatForLicense(beat);
    setShowLicenseModal(true);
  };

  // Handle license selection
  const handleLicenseSelect = (beatWithLicense) => {
    const isInCart = cartItems.some(item =>
      getBeatId(item) === getBeatId(beatWithLicense) &&
      item.selectedLicense === beatWithLicense.selectedLicense
    );

    if (isInCart) {
      alert(`"${beatWithLicense.title}" with ${beatWithLicense.licenseName} is already in your cart`);
      return;
    }

    const updatedCart = [...cartItems, beatWithLicense];
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    setShowLicenseModal(false);
    setSelectedBeatForLicense(null);
    alert(`${beatWithLicense.title} with ${beatWithLicense.licenseName} added to cart!`);
  };

  // Toggle wishlist
  const toggleWishlist = (event, beat) => {
    event.stopPropagation();

    const isLoggedIn = localStorage.getItem('token');
    if (!isLoggedIn) {
      alert("Please log in to add items to wishlist");
      navigate("/login");
      return;
    }

    const isInWishlist = wishlist.some(item => getBeatId(item) === getBeatId(beat));
    let updatedWishlist;

    if (isInWishlist) {
      updatedWishlist = wishlist.filter(item => getBeatId(item) !== getBeatId(beat));
      alert(`${beat.title} removed from wishlist`);
    } else {
      updatedWishlist = [...wishlist, beat];
      alert(`${beat.title} added to wishlist!`);
    }

    setWishlist(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
  };

  // Load more beats function
  const loadMoreBeats = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    setTimeout(() => {
      const filteredBeats = filterBeats();
      const currentLength = displayedBeats.length;
      const nextBeats = filteredBeats.slice(currentLength, currentLength + itemsPerLoad);

      if (nextBeats.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedBeats(prev => [...prev, ...nextBeats]);
      }

      setLoadingMore(false);
    }, 500);
  }, [beats, displayedBeats, loadingMore, hasMore, selectedGenre, keywords, priceRange, selectedTags]);

  // Initial load function
  const loadInitialBeats = useCallback(() => {
    const filteredBeats = filterBeats();
    const initialBeats = filteredBeats.slice(0, itemsPerLoad);
    setDisplayedBeats(initialBeats);
    setHasMore(filteredBeats.length > itemsPerLoad);
    setInitialLoad(false);
  }, [beats, selectedGenre, keywords, priceRange, selectedTags]);

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
  };

  const handlePriceChange = (e) => {
    setPriceRange(parseFloat(e.target.value));
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleBeatClick = (beat) => {
    setSelectedBeat(beat);
  };

  const handleCloseModal = () => {
    setSelectedBeat(null);
  };

  // FIXED: Use getBeatId for consistent checking
  const isInWishlist = (beatId) => {
    return wishlist.some(item => getBeatId(item) === beatId);
  };

  const isInCart = (beatId) => {
    return cartItems.some(item => getBeatId(item) === beatId);
  };

  // Load initial beats when component mounts or filters change
  useEffect(() => {
    if (beats.length > 0 && !loading) {
      loadInitialBeats();
    }
  }, [beats, selectedGenre, keywords, priceRange, selectedTags, loadInitialBeats]);

  // Scroll detection for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;

      const scrollTop = window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMoreBeats();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreBeats, loadingMore, hasMore]);

  
  // UI rendering
  if (loading) {
    return (
      <div className={styles.exploreContainer}>
        <NavbarBeatExplore />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading beats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.exploreContainer}>
      <NavbarBeatExplore />

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Explore Beats</h1>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Search for beats..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <FaSearch /> Search
          </button>
        </form>
      </div>

      {/* Filters toolbar */}
      <div className={styles.filtersToolbar}>
        <div className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
          <FaFilter /> Filters <FaChevronDown />
        </div>

        <div className={`${styles.filtersContainer} ${showFilters ? styles.showFilters : ''}`}>
          {/* Genre filter */}
          <div className={styles.filterGroup}>
            <h3 className={styles.filterLabel}>Genre</h3>
            <select
              className={styles.genreSelect}
              value={selectedGenre}
              onChange={(e) => handleGenreSelect(e.target.value)}
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Price range filter */}
          <div className={styles.filterGroup}>
            <h3 className={styles.filterLabel}>Max Price: Rs {priceRange}</h3>
            <input
              type="range"
              min={0}
              max={maxPrice}
              step={1}
              value={priceRange}
              onChange={handlePriceChange}
              className={styles.priceSlider}
            />
          </div>

          {/* Tags filter */}
          {/* <div className={styles.filterGroup}>
            <h3 className={styles.filterLabel}>Tags</h3>
            <div className={styles.tagsFilter}>
              {availableTags.map((tagData, index) => (
                <button
                  key={index}
                  onClick={() => toggleTag(tagData.tag)}
                  className={`${styles.tagFilterButton} ${selectedTags.includes(tagData.tag) ? styles.tagSelected : ''}`}
                >
                  {tagData.tag}
                  <span className={styles.tagCount}>({tagData.count})</span>
                </button>
              ))}
            </div>

            {selectedTags.length > 0 && (
              <div className={styles.selectedTags}>
                <span>Selected: </span>
                {selectedTags.map((tag, index) => (
                  <span key={index} className={styles.selectedTag}>
                    {tag}
                    <button onClick={() => toggleTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div> */}
        </div>

        {/* View mode toggle */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterLabel}>View Mode</h3>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${displayMode === 'grid' ? styles.active : ''}`}
              onClick={() => setDisplayMode('grid')}
            >
              <FaThLarge />
            </button>
            <button
              className={`${styles.viewButton} ${displayMode === 'list' ? styles.active : ''}`}
              onClick={() => setDisplayMode('list')}
            >
              <FaListUl />
            </button>
          </div>
        </div>
      </div>

      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

      {/* FIXED: Consistent play state checking in both grid and list views */}
      {displayMode === "grid" ? (
        <div className={styles.beatsGrid}>
          {displayedBeats.length > 0 ? (
            displayedBeats.map((beat) => {
              // FIXED: Use the context helper function consistently
              const isThisPlaying = isBeatPlaying(beat);

              return (
                <div
                  key={getBeatId(beat)}
                  className={styles.beatCard}
                  onClick={() => handleBeatClick(beat)}
                >
                  <div className={styles.beatImageContainer}>
                    <img
                      src={beat.coverImage || "/default-cover.jpg"}
                      alt={beat.title}
                      className={styles.beatImage}
                      onError={(e) => { e.target.src = "/default-cover.jpg" }}
                    />
                    <div className={styles.beatImageOverlay}>
                      <button
                        className={styles.playButton}
                        onClick={(e) => handlePlayPreview(e, beat)}
                      >
                        {isThisPlaying ? <FaPause /> : <FaPlay />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.beatInfo}>
                    <h3 className={styles.beatTitle}>{beat.title}</h3>
                    <span
                      className={styles.producerName}
                      onClick={(e) => handleProducerClick(e, beat.producer._id)}
                      style={{ cursor: 'pointer', color: '#7B2CBF' }}
                    >
                      {beat.producer?.name || "Unknown Producer"}
                      {beat.producer?.verificationStatus === "approved" && <span className={styles.verifiedBadge}>✓</span>}
                    </span>
                    <div className={styles.beatStats}>
                      <span className={styles.beatPrice}>Rs {beat.price?.toFixed(2) || "0.00"}</span>
                      <span className={styles.beatGenre}>{beat.genre}</span>
                    </div>
                  </div>

                  <div className={styles.beatActions}>
                    <button
                      className={`${styles.cartButton} ${isInCart(getBeatId(beat)) ? styles.inCart : ''}`}
                      onClick={(e) => handleAddToCart(e, beat)}
                      disabled={isInCart(getBeatId(beat))}
                    >
                      <FaCartPlus /> {isInCart(getBeatId(beat)) ? 'In Cart' : 'Add to Cart'}
                    </button>

                    <button
                      className={`${styles.wishlistButton} ${isInWishlist(getBeatId(beat)) ? styles.inWishlist : ''}`}
                      onClick={(e) => toggleWishlist(e, beat)}
                    >
                      <FaHeart />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noBeats}>
              <FaInfoCircle className={styles.noBeatsIcon} />
              <p>No beats match your search criteria</p>
              <button
                className={styles.resetButton}
                onClick={() => {
                  setKeywords("");
                  setSelectedGenre("All Genres");
                  setPriceRange(maxPrice);
                  setSelectedTags([]);
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        // List View with consistent play state checking
        <div className={styles.beatsList}>
          {displayedBeats.length > 0 ? (
            displayedBeats.map((beat) => {
              // Use the context helper function consistently
              const isThisPlaying = isBeatPlaying(beat);

              return (
                <div
                  key={getBeatId(beat)}
                  className={styles.beatRow}
                  onClick={() => handleBeatClick(beat)}
                >
                  <div className={styles.beatRowImageContainer}>
                    <img
                      src={beat.coverImage || "/default-cover.jpg"}
                      alt={beat.title}
                      className={styles.beatRowImage}
                      onError={(e) => { e.target.src = "/default-cover.jpg" }}
                    />
                    <button
                      className={styles.rowPlayButton}
                      onClick={(e) => handlePlayPreview(e, beat)}
                    >
                      {isThisPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>

                  <div className={styles.beatRowInfo}>
                    <h3 className={styles.beatRowTitle}>{beat.title}</h3>
                    <div className={styles.beatRowProducer}>
                      <span
                        onClick={(e) => handleProducerClick(e, beat.producer._id)}
                        style={{ cursor: 'pointer', color: '#7B2CBF' }}
                      >
                        {beat.producer?.name || "Unknown Producer"}
                        {beat.producer?.verificationStatus === "approved" && <span className={styles.verifiedBadge}>✓</span>}
                      </span>
                    </div>
                  </div>

                  <div className={styles.beatRowGenre}>{beat.genre}</div>

                  <div className={styles.beatRowPrice}>Rs {beat.price?.toFixed(2) || "0.00"}</div>

                  <div className={styles.beatRowActions}>
                    <button
                      className={`${styles.rowCartButton} ${isInCart(getBeatId(beat)) ? styles.inCart : ''}`}
                      onClick={(e) => handleAddToCart(e, beat)}
                      disabled={isInCart(getBeatId(beat))}
                    >
                      <FaCartPlus />
                    </button>

                    <button
                      className={`${styles.rowWishlistButton} ${isInWishlist(getBeatId(beat)) ? styles.inWishlist : ''}`}
                      onClick={(e) => toggleWishlist(e, beat)}
                    >
                      <FaHeart />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noBeats}>
              <FaInfoCircle className={styles.noBeatsIcon} />
              <p>No beats match your search criteria</p>
              <button
                className={styles.resetButton}
                onClick={() => {
                  setKeywords("");
                  setSelectedGenre("All Genres");
                  setPriceRange(maxPrice);
                  setSelectedTags([]);
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Single Beat Modal */}
      {selectedBeat && (
        <SingleBeatModal
          beat={selectedBeat}
          isOpen={!!selectedBeat}
          onClose={handleCloseModal}
          onAddToCart={(beat) => handleAddToCart({ stopPropagation: () => { } }, beat)}
          onToggleWishlist={(beat) => toggleWishlist({ stopPropagation: () => { } }, beat)}
          isInCart={isInCart(getBeatId(selectedBeat))}
          isInWishlist={isInWishlist(getBeatId(selectedBeat))}
          isPlaying={isBeatPlaying(selectedBeat)}
          onPlayPause={(e) => handlePlayPreview(e, selectedBeat)}
          isLoading={false}
        />
      )}

      {/* License Selection Modal */}
      {showLicenseModal && selectedBeatForLicense && (
        <LicenseSelectionModal
          beat={selectedBeatForLicense}
          onClose={() => {
            setShowLicenseModal(false);
            setSelectedBeatForLicense(null);
          }}
          onSelectLicense={handleLicenseSelect}
        />
      )}

      {showProducerProfile && selectedProducerId && (
        <ProducerProfile
          producerId={selectedProducerId}
          isOpen={showProducerProfile}
          onClose={() => {
            setShowProducerProfile(false);
            setSelectedProducerId(null);
          }}
        />
      )}

      {/* Infinite Scroll Loading Indicator */}
      {loadingMore && (
        <div className={styles.loadingMore}>
          <div className={styles.spinner}></div>
          <p>Loading more beats...</p>
        </div>
      )}

      {/* No More Beats Indicator */}
      {!hasMore && displayedBeats.length > 0 && (
        <div className={styles.noMoreBeats}>
          <p>You've seen all the beats!</p>
        </div>
      )}
    </div>
  );
};

export default BeatExplorePage;