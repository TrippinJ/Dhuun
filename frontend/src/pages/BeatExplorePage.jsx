import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/BeatExplorePage.module.css";
import { FaCartPlus, FaPlay, FaSearch, FaHeart, FaPause } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';

const BeatExplorePage = () => {
  // State variables
  const [beats, setBeats] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [displayMode, setDisplayMode] = useState("grid"); // 'row' or 'grid'
  const itemsPerPage = 50; // Show beats per page
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  const navigate = useNavigate();

  // Fetch beats from API
  useEffect(() => {
    const fetchBeats = async () => {
      try {
        const response = await API.get("/api/beats");
        console.log("API Response:", response.data);

        // Check if the response data contains the beats array
        if (response.data && response.data.beats) {
          // Use the beats array from the response
          setBeats(response.data.beats);

          if (response.data.beats.length === 0) {
            setErrorMessage("No beats available yet. Please check back later.");
          }
        } else if (Array.isArray(response.data)) {
          // If the response itself is an array (direct beats array)
          setBeats(response.data);

          if (response.data.length === 0) {
            setErrorMessage("No beats available yet. Please check back later.");
          }
        } else {
          // If we can't find a valid beats array
          setBeats([]);
          setErrorMessage("No beats data available");
        }
      } catch (error) {
        console.error("Failed to fetch beats:", error);
        setErrorMessage("Error fetching beats. Please try again later.");
        setBeats([]); // Ensure beats is always an array
      } finally {
        setLoading(false);
      }
    };
    fetchBeats();
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    try {
      const storedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      setWishlistItems(storedWishlist);
      setWishlistCount(storedWishlist.length);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      setWishlistItems([]);
    }
  }, []);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (player) {
        player.pause();
        player.src = ""; // Clear the source
      }
    };
  }, [player]);

  // Set max price after beats are loaded
  useEffect(() => {
    if (beats && beats.length > 0) {
      const prices = beats.map(beat => beat.price);
      const max = Math.max(...prices);
      setMaxPrice(max);
      setPriceRange(max); // Set initial slider to maximum
    }
  }, [beats]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Replace with your actual categories endpoint
        const response = await API.get("/api/beat-categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Helper function to check if a beat is in wishlist
  const isInWishlist = (beatId) => {
    return wishlistItems.some(item => item._id === beatId);
  };

  // Filter functions
  const filterBeatsByKeyword = () => {
    if (!keywords.trim()) {
      return beats;
    }
    return beats.filter((beat) =>
      beat.title?.toLowerCase().includes(keywords.toLowerCase()) ||
      beat.artist?.toLowerCase().includes(keywords.toLowerCase())
    );
  };

  const filterBeatsByCategory = (filteredBeats) => {
    if (!selectedCategory) {
      return filteredBeats;
    }
    return filteredBeats.filter((beat) => beat.category === selectedCategory);
  };

  const filterBeatsByPrice = (filteredBeats) => {
    return filteredBeats.filter((beat) => beat.price <= priceRange);
  };

  // Apply all filters
  const applyAllFilters = () => {
    let filtered = filterBeatsByKeyword();
    filtered = filterBeatsByCategory(filtered);
    filtered = filterBeatsByPrice(filtered);
    return filtered;
  };

  // Get the current page of beats
  const getPagedBeats = () => {
    const filteredBeats = applyAllFilters();
    const startIndex = currentPage * itemsPerPage;
    return filteredBeats.slice(startIndex, startIndex + itemsPerPage);
  };

  // Audio playback with HTML5 Audio
  const handlePlayPreview = async (beatId) => {
    try {
      // Find the beat
      const beat = displayedBeats.find(b => b._id === beatId);
      if (!beat) {
        console.error(`Beat with ID ${beatId} not found`);
        return;
      }
      
      // Get audio URL
      const audioUrl = beat.audioFile || beat.audioUrl;
      console.log("Playing URL:", audioUrl);
      
      if (!audioUrl) {
        console.error("No audio URL found for this beat");
        return;
      }
      
      // If already playing this beat, toggle play/pause
      if (currentlyPlaying === beatId && player) {
        if (!player.paused) {
          player.pause();
          setCurrentlyPlaying(null);
        } else {
          player.play();
          setCurrentlyPlaying(beatId);
        }
        return;
      }
      
      // Otherwise, start fresh with a new audio player
      setAudioLoading(true);
      
      // Stop previous audio if playing
      if (player) {
        player.pause();
        player.src = "";
      }
      
      // Create standard HTML5 Audio element
      const audio = new Audio();
      
      // Set up event handlers first
      audio.oncanplaythrough = () => {
        setAudioLoading(false);
        audio.play()
          .then(() => {
            console.log("Audio playback started successfully");
            setCurrentlyPlaying(beatId);
          })
          .catch(error => {
            console.error("Failed to start playback:", error);
            setAudioLoading(false);
          });
      };
      
      audio.onended = () => {
        setCurrentlyPlaying(null);
      };
      
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        console.error("Error code:", audio.error ? audio.error.code : "unknown");
        console.error("Error message:", audio.error ? audio.error.message : "unknown");
        setAudioLoading(false);
        setCurrentlyPlaying(null);
      };
      
      // Log loading states
      audio.onloadstart = () => console.log("Audio loading started");
      audio.onprogress = () => console.log("Audio download in progress");
      audio.onstalled = () => console.log("Audio download stalled");
      
      // Set the source (this triggers loading)
      audio.src = audioUrl;
      audio.load(); // Explicitly start loading
      
      // Store the audio element
      setPlayer(audio);
      
    } catch (error) {
      console.error("Audio playback error:", error);
      setAudioLoading(false);
    }
  };

  // Handle favorite/wishlist functionality
  const handleToggleFavorite = (beat, event) => {
    // Prevent the event from propagating to other handlers
    if (event) {
      event.stopPropagation();
    }
    
    try {
      // Get current wishlist
      let wishlist = [];
      try {
        wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      } catch (error) {
        console.error("Error parsing wishlist:", error);
        wishlist = [];
      }
      
      // Check if beat is already in wishlist
      const beatIndex = wishlist.findIndex(item => item._id === beat._id);
      
      if (beatIndex !== -1) {
        // Remove from wishlist if already there
        wishlist.splice(beatIndex, 1);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        setWishlistItems(wishlist);
        setWishlistCount(wishlist.length);
      } else {
        // Add to wishlist
        wishlist.push(beat);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        setWishlistItems(wishlist);
        setWishlistCount(wishlist.length);
      }
      
      // Force storage event to update other components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };
  
  // Handlers
  const handleBuy = (beat, event) => {
    // Prevent the event from propagating to other handlers
    if (event) {
      event.stopPropagation();
    }
    
    const isLoggedIn = localStorage.getItem('token'); // Check if user is logged in

    if (isLoggedIn) {
      // Get current cart from localStorage
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem("cart") || "[]");
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
      
      // Add beat to cart without any limit
      cart.push(beat);
      
      // Update local state
      setCartItems(cart);
      
      // Save cart to localStorage
      localStorage.setItem("cart", JSON.stringify(cart));
      
      console.log(`Added ${beat.title} to cart`);
      alert(`${beat.title} added to cart!`);
      
      // Force storage event to update other components
      window.dispatchEvent(new Event('storage'));
    } else {
      alert("Please log in to add items to cart");
      navigate("/login");
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentPage(0); // Reset to first page when changing category
  };

  const handlePriceChange = (e) => {
    setPriceRange(e.target.value);
    setCurrentPage(0); // Reset to first page when changing price
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0); // Reset to first page when searching
    // Search is already handled by the filterBeatsByKeyword function
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === "grid" ? "row" : "grid");
  };

  if (loading) {
    return (
      <div className={styles.exploreContainer}>
        <NavbarBeatExplore />
        <div className={styles.loading}>Loading beats...</div>
      </div>
    );
  }

  const filteredBeats = applyAllFilters();
  const pageCount = Math.ceil(filteredBeats.length / itemsPerPage);
  const displayedBeats = getPagedBeats();

  return (
    <div className={styles.exploreContainer}>
      <NavbarBeatExplore />

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Explore Beats</h1>

        {/* Search bar */}
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

      <div className={styles.contentContainer}>
        {/* Filters sidebar */}
        <div className={styles.filterSidebar}>
          {/* Display mode toggle */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>View Mode</h3>
            <button
              onClick={toggleDisplayMode}
              className={styles.modeToggleButton}
            >
              {displayMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
            </button>
          </div>

          {/* Category filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Categories</h3>
            <div className={styles.categoryList}>
              <button
                className={!selectedCategory ? styles.categoryButtonActive : styles.categoryButton}
                onClick={() => handleCategorySelect(null)}
              >
                All Beats
              </button>
              {categories && categories.map((category) => (
                <button
                  key={category.id}
                  className={selectedCategory === category.name ? styles.categoryButtonActive : styles.categoryButton}
                  onClick={() => handleCategorySelect(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price filter */}
          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Price Range</h3>
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={priceRange}
              onChange={handlePriceChange}
              className={styles.priceSlider}
            />
            <p className={styles.priceDisplay}>Max: ${priceRange}</p>
          </div>
        </div>

        {/* Main content */}
        <div className={styles.mainContent}>
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

          {displayMode === "grid" ? (
            /* Grid View */
            <div className={styles.grid}>
              {displayedBeats.length > 0 ? (
                displayedBeats.map((beat) => (
                  <div key={beat._id} className={styles.card}>
                    <div className={styles.cardImage}>
                      <img
                        src={beat.coverImage || "/default-cover.jpg"}
                        alt={beat.title}
                        className={styles.cover}
                      />
                      {beat.discount && (
                        <div className={styles.discountBadge}>
                          {beat.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className={styles.cardInfo}>
                      <h3>{beat.title}</h3>
                      <p className={styles.artist}>{beat.artist || beat.producer?.name || "Unknown Artist"}</p>
                      <p className={styles.price}>${beat.price}</p>
                      {beat.category && <p className={styles.category}>{beat.category}</p>}
                    </div>
                    <div className={styles.cardActions}>
                      <button 
                        className={styles.buyButton} 
                        onClick={(e) => handleBuy(beat, e)}
                      >
                        <FaCartPlus /> Add to Cart
                      </button>
                      <button 
                        className={styles.downloadButton} 
                        onClick={() => handlePlayPreview(beat._id)}
                        disabled={audioLoading && currentlyPlaying === beat._id}
                      >
                        {audioLoading && currentlyPlaying === beat._id ? (
                          <span>Loading...</span>
                        ) : currentlyPlaying === beat._id ? (
                          <FaPause />
                        ) : (
                          <FaPlay />
                        )} {currentlyPlaying === beat._id ? 'Pause' : 'Play'}
                      </button>
                      <button 
                        className={`${styles.favoriteButton} ${isInWishlist(beat._id) ? styles.favoriteActive : ''}`}
                        onClick={(e) => handleToggleFavorite(beat, e)}
                      >
                        <FaHeart />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noBeats}>No beats match your search criteria</div>
              )}
            </div>
          ) : (
            /* Row View */
            <div className={styles.beatList}>
              {displayedBeats.length > 0 ? (
                displayedBeats.map((beat) => (
                  <div key={beat._id} className={styles.beatRow}>
                    <img
                      src={beat.coverImage || "/default-cover.jpg"}
                      alt={beat.title}
                      className={styles.coverArt}
                    />
                    <div className={styles.beatInfo}>
                      <h3>{beat.title}</h3>
                      <p className={styles.artist}>{beat.artist || beat.producer?.name || "Unknown Artist"}</p>
                      {beat.category && <p className={styles.category}>{beat.category}</p>}
                      <p className={styles.price}>${beat.price}</p>
                    </div>
                    <div className={styles.controls}>
                      <button 
                        className={styles.playButton} 
                        onClick={() => handlePlayPreview(beat._id)}
                        disabled={audioLoading && currentlyPlaying === beat._id}
                      >
                        {audioLoading && currentlyPlaying === beat._id ? (
                          <span>Loading...</span>
                        ) : currentlyPlaying === beat._id ? (
                          <FaPause />
                        ) : (
                          <FaPlay />
                        )} {currentlyPlaying === beat._id ? 'Pause' : 'Play'}
                      </button>
                      <button 
                        className={styles.cartButton} 
                        onClick={(e) => handleBuy(beat, e)}
                      >
                        <FaCartPlus /> Add to Cart
                      </button>
                      <button 
                        className={`${styles.favoriteButton} ${isInWishlist(beat._id) ? styles.favoriteActive : ''}`}
                        onClick={(e) => handleToggleFavorite(beat, e)}
                      >
                        <FaHeart />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noBeats}>No beats match your search criteria</div>
              )}
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={styles.paginationButton}
              >
                Previous
              </button>

              {[...Array(pageCount)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => handlePageChange(index)}
                  className={currentPage === index ? styles.paginationButtonActive : styles.paginationButton}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pageCount - 1}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BeatExplorePage;