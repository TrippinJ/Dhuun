import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../Assets/DHUUN.png";
import { BsCart2 } from "react-icons/bs";
import { FaUser, FaHeart, FaUserCircle, FaCrown, FaSignOutAlt, FaCog } from "react-icons/fa";
import { HiOutlineBars3 } from "react-icons/hi2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from "@mui/icons-material/Home";
import StoreIcon from "@mui/icons-material/Store";
import SellIcon from "@mui/icons-material/Sell";
import PeopleIcon from "@mui/icons-material/People";
import LoginIcon from "@mui/icons-material/Login";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DownloadIcon from "@mui/icons-material/Download";
import { styled } from '@mui/material/styles';
import "../css/Navbar.css";

// Custom styled components for the sidebar menu
const StyledListItemButton = styled(ListItemButton)({
  padding: '16px',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
});

const StyledListItemIcon = styled(ListItemIcon)({
  minWidth: '40px',
  color: '#555',
});

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [userName, setUserName, ] = useState('');
  const [userAvatar, setUserAvatar] = useState('');

  // Check if user is logged in and get user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      setIsLoggedIn(true);
      try {
        const userData = JSON.parse(user);
        setUserInfo(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Get cart count
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

  // Get wishlist count
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

    updateWishlistCount();

    // Add event listener for storage changes
    window.addEventListener("storage", updateWishlistCount);

    return () => {
      window.removeEventListener("storage", updateWishlistCount);
    };
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setShowDropdown(false);
    navigate("/");
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
          setUserName(userData.fullname || userData.name || "User");
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
      navigate("/dashboard/purchases");
    }
  };
  // Menu items - used for both navbar and sidebar
  const menuItems = [
    {
      text: "Buy Beats",
      route: "/BeatExplorePage",
      icon: <StoreIcon />
    },
    {
      text: "Sell Beats",
      route: "/login?role=seller",
      icon: <SellIcon />
    },
    {
      text: "Creator Community",
      route: "/creator-community",
      icon: <PeopleIcon />
    }
  ];

  // User menu items (when logged in)
  const userMenuItems = [
    {
      text: "Dashboard",
      icon: <FaCog />,
      route: navigateToDashboard
    },
    {
      text: "Upgrade Plan",
      icon: <FaCrown />,
      route: "/subscription"
    },
    {
      text: "Favorites",
      icon: <FaHeart />,
      route: "/favorites"
    },
    {
      text: "Purchased",
      icon: <DownloadIcon />,
      route: "/dashboard"
    },

    {
      text: "Logout",
      icon: <FaSignOutAlt />,
      action: handleLogout
    }
  ];

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="nav-logo-container">
        <img
          src={Logo}
          alt="Dhuun Logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", width: "100px", height: "auto" }}
        />
      </div>

      {/* Desktop Links */}
      <div className="navbar-links-container">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(item.route);
            }}
          >
            {item.text}
          </a>
        ))}

        {isLoggedIn ? (
          <>
            {/* Wishlist Icon */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/favorites");
              }}
            >
              <div className="icon-with-badge">
                <FaHeart className="navbar-icon" />
                {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
              </div>
            </a>

            {/* Cart Icon */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/cart");
              }}
            >
              <div className="icon-with-badge">
                <BsCart2 className="navbar-cart-icon" />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </div>
            </a>

            {/* User Profile Dropdown */}
            <div className="profile-dropdown" ref={dropdownRef}>
              <div
                className="profile-trigger"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {userInfo?.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name || "User"}
                    className="avatar-img"
                  />
                ) : (
                  <FaUserCircle className="avatar-icon" />
                )}
                <span className="username">{userInfo?.name || "User"}</span>
              </div>

              {showDropdown && (
                <div className="dropdown-menu">
                  {userMenuItems.map((item, index) => (
                    <div
                      key={index}
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        if (item.action) {
                          item.action();
                        } else {
                          navigate(item.route);
                          setShowDropdown(false);
                        }
                      }}
                    >
                      <span className="dropdown-icon">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Log In
            </a>

            <button
              className="primary-button"
              onClick={() => navigate("/chooserole")}
            >
              Start Your Journey
            </button>
          </>
        )}
      </div>

      {/* Hamburger Menu Icon for Mobile */}
      <div className="navbar-menu-container">
        <HiOutlineBars3 onClick={() => setOpenMenu(true)} />
      </div>

      {/* Sidebar Drawer for Mobile */}
      <Drawer
        anchor="right"
        open={openMenu}
        onClose={() => setOpenMenu(false)}
      >
        <Box
          sx={{
            width: 250,
            height: "100%",
            backgroundColor: "#fff",
            paddingTop: "20px"
          }}
          role="presentation"
        >
          <List sx={{ width: '100%' }}>
            {/* Add Home as first item in sidebar */}
            <ListItem disablePadding>
              <StyledListItemButton
                onClick={() => {
                  navigate("/");
                  setOpenMenu(false);
                }}
              >
                <StyledListItemIcon>
                  <HomeIcon />
                </StyledListItemIcon>
                <ListItemText
                  primary="Home"
                  primaryTypographyProps={{
                    style: {
                      fontWeight: 500,
                      fontSize: '1rem',
                      color: '#333'
                    }
                  }}
                />
              </StyledListItemButton>
            </ListItem>

            {/* All regular menu items */}
            {menuItems.map((item, index) => (
              <ListItem key={index} disablePadding>
                <StyledListItemButton
                  onClick={() => {
                    navigate(item.route);
                    setOpenMenu(false);
                  }}
                >
                  <StyledListItemIcon>
                    {item.icon}
                  </StyledListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      style: {
                        fontWeight: 500,
                        fontSize: '1rem',
                        color: '#333'
                      }
                    }}
                  />
                </StyledListItemButton>
              </ListItem>
            ))}

            {/* Add wishlist item */}
            <ListItem disablePadding>
              <StyledListItemButton
                onClick={() => {
                  navigate("/favorites");
                  setOpenMenu(false);
                }}
              >
                <StyledListItemIcon>
                  <FavoriteIcon />
                </StyledListItemIcon>
                <ListItemText
                  primary="Wishlist"
                  primaryTypographyProps={{
                    style: {
                      fontWeight: 500,
                      fontSize: '1rem',
                      color: '#333'
                    }
                  }}
                />
              </StyledListItemButton>
            </ListItem>

            {/* Add cart item */}
            <ListItem disablePadding>
              <StyledListItemButton
                onClick={() => {
                  navigate("/cart");
                  setOpenMenu(false);
                }}
              >
                <StyledListItemIcon>
                  <ShoppingCartRoundedIcon />
                </StyledListItemIcon>
                <ListItemText
                  primary="Cart"
                  primaryTypographyProps={{
                    style: {
                      fontWeight: 500,
                      fontSize: '1rem',
                      color: '#333'
                    }
                  }}
                />
              </StyledListItemButton>
            </ListItem>

            {/* Conditionally add user menu items if logged in */}
            {isLoggedIn ? (
              userMenuItems.map((item, index) => (
                <ListItem key={`user-${index}`} disablePadding>
                  <StyledListItemButton
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        navigate(item.route);
                      }
                      setOpenMenu(false);
                    }}
                  >
                    <StyledListItemIcon>
                      {item.icon}
                    </StyledListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        style: {
                          fontWeight: 500,
                          fontSize: '1rem',
                          color: '#333'
                        }
                      }}
                    />
                  </StyledListItemButton>
                </ListItem>
              ))
            ) : (
              <ListItem disablePadding>
                <StyledListItemButton
                  onClick={() => {
                    navigate("/login");
                    setOpenMenu(false);
                  }}
                >
                  <StyledListItemIcon>
                    <LoginIcon />
                  </StyledListItemIcon>
                  <ListItemText
                    primary="Login"
                    primaryTypographyProps={{
                      style: {
                        fontWeight: 500,
                        fontSize: '1rem',
                        color: '#333'
                      }
                    }}
                  />
                </StyledListItemButton>
              </ListItem>
            )}

            {/* Add "Start Your Journey" button if not logged in */}
            {!isLoggedIn && (
              <ListItem disablePadding>
                <StyledListItemButton
                  onClick={() => {
                    navigate("/chooserole");
                    setOpenMenu(false);
                  }}
                  sx={{
                    marginTop: '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(123, 44, 191, 0.1)',
                    }
                  }}
                >
                  <StyledListItemIcon>
                    <RocketLaunchIcon />
                  </StyledListItemIcon>
                  <ListItemText
                    primary="Start Your Journey"
                    primaryTypographyProps={{
                      style: {
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: '#7B2CBF'
                      }
                    }}
                  />
                </StyledListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </nav>
  );
};

export default Navbar;