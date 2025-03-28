import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/BeatExplorePage.module.css";
import { FaCartPlus, FaDownload, FaSearch, FaHeart } from "react-icons/fa";
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
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6; // Show 6 beats per page

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

  // Filter functions
  const filterBeatsByKeyword = () => {
    if (!keywords.trim()) {
      return beats;
    }
    return beats.filter((beat) => 
      beat.title.toLowerCase().includes(keywords.toLowerCase()) ||
      beat.artist.toLowerCase().includes(keywords.toLowerCase())
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

  // Handlers
  const handleBuy = (beat) => {
    const isLoggedIn = localStorage.getItem('token'); // Check if user is logged in
    
    if (isLoggedIn) {
      if (cartItems.length < 3) { // Limit cart to 3 items
        setCartItems([...cartItems, beat]);
        console.log(`Added ${beat.title} to cart`);
        // In a real app, you'd dispatch to Redux here
        alert(`${beat.title} added to cart!`);
      } else {
        alert("Only 3 beats can be added to cart at a time");
      }
    } else {
      alert("Please log in to add items to cart");
      navigate("/login");
    }
  };

  const handleDownload = (beatId) => {
    console.log(`Download beat with ID: ${beatId}`);
    // Implement download functionality here
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

  if (loading) {
    return <div className={styles.loading}>Loading beats...</div>;
  }

  const filteredBeats = applyAllFilters();
  const pageCount = Math.ceil(filteredBeats.length / itemsPerPage);
  const displayedBeats = getPagedBeats();

  return (
    <div className={styles.exploreContainer}>
      <NavbarBeatExplore />
      
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🎶 Explore Beats</h1>
        
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

        {/* Main content - Beat grid */}
        <div className={styles.mainContent}>
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          
          {/* Beats grid */}
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
                    <p className={styles.artist}>{beat.artist}</p>
                    <p className={styles.price}>${beat.price}</p>
                    {beat.category && <p className={styles.category}>{beat.category}</p>}
                  </div>
                  <div className={styles.cardActions}>
                    <button className={styles.buyButton} onClick={() => handleBuy(beat)}>
                      <FaCartPlus /> Add to Cart
                    </button>
                    <button className={styles.downloadButton} onClick={() => handleDownload(beat._id)}>
                      <FaDownload /> Preview
                    </button>
                    <button className={styles.favoriteButton}>
                      <FaHeart /> Favorite
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noBeats}>No beats match your search criteria</div>
            )}
          </div>

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