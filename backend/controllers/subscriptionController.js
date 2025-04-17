import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/NavbarBeatExplore.module.css";
import Logo from "../Assets/DHUUN.png"; 
import { FaShoppingCart, FaUserCircle, FaHeart, FaSignOutAlt, FaCog, FaCrown, FaDownload } from 'react-icons/fa';
import API from "../api/api";

const NavbarBeatExplore = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userAvatar, setUserAvatar] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null); // renamed to avoid conflicts
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
          setUserName(userData.fullname || userData.name || "User");
          if (userData.avatar) {
            setUserAvatar(userData.avatar);
          }
        } catch (error) {
          console.error("Error parsing user data", error);
        }
      }
      
      // Fetch subscription data
      try {
        const fetchSubscription = async () => {
          try {
            const response = await API.get("/api/subscription", {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && response.data.subscription) {
              setUserSubscription(response.data.subscription);
              console.log("Subscription data:", response.data.subscription);
            }
          } catch (error) {
            console.error("Error fetching subscription:", error);
            // Don't show error to user, just fail silently
          }
        };
        
        fetchSubscription();
      } catch (error) {
        console.error("Error in subscription fetch:", error);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Rest of your existing code...

  // Get subscription badge class - modified to use userSubscription
  const getSubscriptionBadgeClass = () => {
    if (!userSubscription) return "";
    
    switch(userSubscription.plan) {
      case "Pro":
        return styles.proBadge;
      case "Standard":
        return styles.standardBadge;
      default:
        return styles.freeBadge;
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate("/login");
  };

  // User menu items - modified to use userSubscription
  const userMenuItems = [
    {
      text: "Dashboard",
      icon: <FaCog className={styles.dropdownIcon} />,
      onClick: () => navigate("/dashboard")
    },
    {
      text: userSubscription ? 
            `${userSubscription.plan} Plan` : 
            "Upgrade Plan",
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
              {userSubscription && userSubscription.plan !== "Free" && (
                <span className={`${styles.planBadge} ${getSubscriptionBadgeClass()}`}>
                  {userSubscription.plan}
                </span>
              )}
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
                    <span>{item.text}</span>
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