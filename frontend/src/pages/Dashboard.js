import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api"; 
import styles from "../css/Dashboard.module.css";
import { FaUserCircle, FaMusic, FaChartLine, FaSignOutAlt, FaTools } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await API.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.profileSection}>
          <FaUserCircle className={styles.profileIcon} />
          <h3>{user?.name || "User"}</h3>
          <span className={styles.role}>Starter Producer</span>
        </div>
        <nav>
          <ul>
            <li className={styles.active}><FaChartLine /> Dashboard</li>
            <li><FaMusic /> Insights</li>
            <li><FaTools /> Selling Tools</li>
            <li onClick={handleLogout}><FaSignOutAlt /> Logout</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h2>Dashboard</h2>
          <button className={styles.uploadBtn}>Upload Media</button>
        </div>

        {/* Profile Overview */}
        <div className={styles.profileOverview}>
          <div className={styles.profileCard}>
            <FaUserCircle className={styles.profileImage} />
            <div>
              <h3>{user?.name || "User"}</h3>
              <p>Starter Producer</p>
            </div>
          </div>
          <div className={styles.stats}>
            <div>
              <h4>Items Sold</h4>
              <p>0</p>
            </div>
            <div>
              <h4>Plays</h4>
              <p>0</p>
            </div>
            <div>
              <h4>Earnings</h4>
              <p>$0.00</p>
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <h3 className={styles.sectionTitle}>Tools</h3>
        <div className={styles.toolsSection}>
          <button className={styles.toolCard}>🎵 New Beats</button>
          <button className={styles.toolCard}>💰 Monetization</button>
          <button className={styles.toolCard}>📈 Sales Insights</button>
          <button className={styles.toolCard}>🎨 Artwork Library</button>
        </div>

        {/* Upgrade CTA */}
        <div className={styles.upgradeBox}>
          <p>Upgrade now to Platinum Annual and save 60%</p>
          <button className={styles.upgradeBtn}>Upgrade</button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
