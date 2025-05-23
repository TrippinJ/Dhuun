import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/NavbarBeatExplore.module.css";
import Logo from "../Assets/DHUUN.png"
import { FaShoppingCart, FaUserCircle, FaHeart, FaSignOutAlt, FaCog, FaCrown, FaDownload } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext'; // Add this import

const NavbarBeatExplore = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { settings } = useSettings();
  
  // Replace manual auth state with AuthContext
  const { user, isLoggedIn, logout } = useAuth();

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

  // Update wishlist count
  useEffect(() => {
    const updateWishlistCount = () => {
      try {
        const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        setWishlistCount(wishlist.length);
      } catch (error) {
        console.error("Error parsing wishlist:", error);
        setWishlistCount(0);
      }
    };

    // Update on mount
    updateWishlistCount();

    // Add event listener for storage changes
    window.addEventListener("storage", updateWishlistCount);

    return () => {
      window.removeEventListener("storage", updateWishlistCount);
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

  // Handle logout using AuthContext's logout function
  const handleLogout = () => {
    logout(); // Using AuthContext's logout function
    setShowDropdown(false);
    navigate("/login");
  };

  // Updated function to handle dashboard navigation based on role
  const navigateToDashboard = () => {
    if (!user) return;
    
    if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user.role === "seller") {
      navigate("/dashboard");
    } else {
      // For buyers or unspecified roles
      navigate("/dashboard");
    }
  };

  // User menu items - dynamically generated based on role
  const getUserMenuItems = () => {
    const baseItems = [
      {
        text: "Dashboard",
        icon: <FaCog className={styles.dropdownIcon} />,
        onClick: navigateToDashboard
      },
      {
        text: "Wishlist",
        icon: <FaHeart className={styles.dropdownIcon} />,
        onClick: () => navigate("/favorites")
      },
      {
        text: "Purchased",
        icon: <FaDownload className={styles.dropdownIcon} />,
        onClick: () => navigate("/dashboard/purchased")
      },
      {
        text: "Logout",
        icon: <FaSignOutAlt className={styles.dropdownIcon} />,
        onClick: handleLogout
      }
    ];

    // Only add Upgrade Plan for seller role
    if (user?.role === "seller") {
      return [
        baseItems[0], // Dashboard
        {
          text: "Upgrade Plan",
          icon: <FaCrown className={styles.dropdownIcon} />,
          onClick: () => navigate("/subscription")
        },
        ...baseItems.slice(1) // Rest of the items
      ];
    }

    return baseItems;
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLogo}>
        <img src={settings.logoUrl || Logo} alt="Dhuun Logo" onClick={() => navigate("/")}
        style={{ cursor: "pointer", width: "100px", height: "auto" }}
          onError={(e) => {
            console.error('Logo failed to load:', e.target.src);
            e.target.src = Logo;
          }} />
      </div>

      <div className={styles.navLinks}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/BeatExplorePage"); }} className={styles.navLink}>Explore Beats</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/chooserole"); }} className={styles.navLink}>Sell Beats</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/creator-community"); }} className={styles.navLink}>Community</a>

        
      </div>

      <div className={styles.navActions}>
        {/* Wishlist link */}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/favorites"); }} className={styles.navLink}>
          <div className={styles.cartIconContainer}>
            <FaHeart />
            {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
          </div>
          {/* Wishlist */}
        </a>

        {/* Cart link */}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/cart"); }} className={styles.navLink}>
          <div className={styles.cartIconContainer}>
            <FaShoppingCart />
            {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
          </div>
          {/* Cart */}
        </a>
        {isLoggedIn ? (
          <div className={styles.profileContainer} ref={dropdownRef}>
            <button
              className={styles.profileButton}
              onClick={toggleDropdown}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name || "User"} className={styles.profileAvatar} />
              ) : (
                <FaUserCircle className={styles.profileIcon} />
              )}
              {/* {user?.name || user?.username || "User"} */}
            </button>

            {showDropdown && (
              <div className={styles.dropdown}>
                {getUserMenuItems().map((item, index) => (
                  <button
                    key={index}
                    className={styles.dropdownItem}
                    onClick={item.onClick}
                  >
                    {item.icon}
                    {item.text}
                  </button>
                ))}
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