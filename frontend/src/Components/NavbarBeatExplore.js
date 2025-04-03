import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/NavbarBeatExplore.module.css";
import Logo from "../Assets/DHUUN.png"; 
import { FaShoppingCart, FaUserCircle } from 'react-icons/fa';

const NavbarBeatExplore = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [cartCount, setCartCount] = useState(0);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (token) {
      setIsLoggedIn(true);
      
      // Try to get user name from localStorage
      if (user) {
        try {
          const userData = JSON.parse(user);
          setUserName(userData.fullname || userData.name || "User");
        } catch (error) {
          console.error("Error parsing user data", error);
        }
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Update cart count
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(cart.length);
      } catch (error) {
        console.error("Error parsing cart:", error);
        setCartCount(0);
      }
    };
    
    // Update on mount
    updateCartCount();
    
    // Add event listener for storage changes
    window.addEventListener("storage", updateCartCount);
    
    // Set an interval to check periodically
    const interval = setInterval(updateCartCount, 2000);
    
    return () => {
      window.removeEventListener("storage", updateCartCount);
      clearInterval(interval);
    };
  }, []);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setShowDropdown(false);
    alert("You have been logged out successfully");
    navigate("/login");
  };

  // Navigate to dashboard
  const goToDashboard = () => {
    navigate("/dashboard");
    setShowDropdown(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLogo}>
        <img src={Logo} alt="Dhuun Logo" onClick={() => navigate("/")} />
      </div>
      
      <div className={styles.navLinks}>
        <a href="/BeatExplorePage" className={styles.navLink}>Explore Beats</a>
        <a href="/chooserole" className={styles.navLink}>Sell Beats</a>
        <a href="/creator-community" className={styles.navLink}>Community</a>
        <a href="/cart" className={styles.navLink}>
          <div className={styles.cartIconContainer}>
            <FaShoppingCart />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </div>
          Cart
        </a>
      </div>
      
      <div className={styles.navActions}>
        {isLoggedIn ? (
          <div className={styles.profileContainer} ref={dropdownRef}>
            <button 
              className={styles.profileButton} 
              onClick={toggleDropdown}
            >
              <FaUserCircle className={styles.profileIcon} /> {userName}
            </button>
            
            {showDropdown && (
              <div className={styles.dropdown}>
                <button 
                  className={styles.dropdownItem}
                  onClick={goToDashboard}
                >
                  <span className={styles.dropdownIcon}>📊</span>
                  Dashboard
                </button>
                <button 
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                >
                  <span className={styles.dropdownIcon}>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            className={styles.loginButton}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavbarBeatExplore;