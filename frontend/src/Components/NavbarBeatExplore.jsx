import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/NavbarBeatExplore.module.css";
import Logo from "../Assets/DHUUN.png";
import { FaShoppingCart, FaUserCircle, FaHeart, FaSignOutAlt, FaCog, FaCrown, FaDownload } from 'react-icons/fa';

const NavbarBeatExplore = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token) {
      setIsLoggedIn(true);

      // Try to get user name and avatar from localStorage
      if (user) {
        try {
          const userData = JSON.parse(user);
          setUserName(userData.username || "User");
          if (userData.avatar) {
            setUserAvatar(userData.avatar);
          }
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate("/login");
  };


  const [userRole, setUserRole] = useState(null);

  // Update the useEffect where you check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token) {
      setIsLoggedIn(true);

      // Try to get user name, avatar and role from localStorage
      if (user) {
        try {
          const userData = JSON.parse(user);
          setUserName(userData.username || userData.name || "User");
          setUserRole(userData.role || "buyer"); // Set default role as buyer
          if (userData.avatar) {
            setUserAvatar(userData.avatar);
          }
        } catch (error) {
          console.error("Error parsing user data", error);
        }
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Updated function to handle dashboard navigation based on role
  const navigateToDashboard = () => {
    if (userRole === "admin") {
      navigate("/admin/dashboard");
    } else if (userRole === "seller") {
      navigate("/dashboard");
    } else {
      // For buyers or unspecified roles
      navigate("/dashboard");
    }
  };
  // User menu items
  const userMenuItems = [
    {
      text: "Dashboard",
      icon: <FaCog className={styles.dropdownIcon} />,
      onClick: navigateToDashboard
    },
    {
      text: "Upgrade Plan",
      icon: <FaCrown className={styles.dropdownIcon} />,
      onClick: () => navigate("/subscription")
    },
    {
      text: "Favorites",
      icon: <FaHeart className={styles.dropdownIcon} />,
      onClick: () => navigate("/favorites")
    },
    {
      text: "Purchased",
      icon: <FaDownload className={styles.dropdownIcon} />,
      onClick: () => navigate("/dashboard")
    },

    {
      text: "Logout",
      icon: <FaSignOutAlt className={styles.dropdownIcon} />,
      onClick: handleLogout
    }
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLogo}>
        <img src={Logo} alt="Dhuun Logo" onClick={() => navigate("/")} />
      </div>

      <div className={styles.navLinks}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/BeatExplorePage"); }} className={styles.navLink}>Explore Beats</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/chooserole"); }} className={styles.navLink}>Sell Beats</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/creator-community"); }} className={styles.navLink}>Community</a>

        {/* Wishlist link */}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/favorites"); }} className={styles.navLink}>
          <div className={styles.cartIconContainer}>
            <FaHeart />
            {wishlistCount > 0 && <span className={styles.cartBadge}>{wishlistCount}</span>}
          </div>
          Wishlist
        </a>

        {/* Cart link */}
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/cart"); }} className={styles.navLink}>
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
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className={styles.profileAvatar} />
              ) : (
                <FaUserCircle className={styles.profileIcon} />
              )}
              {userName}
            </button>

            {showDropdown && (
              <div className={styles.dropdown}>
                {userMenuItems.map((item, index) => (
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