import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import { FaSearch, FaUserCircle } from "react-icons/fa"; // Profile and search icons
import Logo from "../Assets/DHUUN.png";
import { BsCart2 } from "react-icons/bs";
import styles from "../css/NavbarBeatExplore.module.css"; // Separate CSS file for this navbar

const NavbarBeatExplore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Handle search action (to be enhanced)
  const handleSearch = () => {
    console.log("Searching for:", searchQuery);
  };

  // Navigate to profile page
  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logoContainer}>
        <img src={Logo} alt="Dhuun Logo" width={100} style={{ height: "auto" }} />
      </div>
      <div className={styles.navLinksContainer}>
        <a href="/buy-beats">Buy Beats</a>
        <a href="/sell-beats">Sell Beats</a>
        <a href="/creator-community">Creator Community</a>
        <a href="/cart">
          <BsCart2 className={styles.cartIcon} />
        </a>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search beats..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button className={styles.searchButton} onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
        <button className={styles.profileButton} onClick={handleProfileClick}>
          <FaUserCircle size={24} />
        </button>
      </div>
    </nav>
  );
};

export default NavbarBeatExplore;
