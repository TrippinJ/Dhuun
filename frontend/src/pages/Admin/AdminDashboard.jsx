// In frontend/src/pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../Components/Admin/AdminSidebar';
import AdminOverview from '../../Components/Admin/AdminOverview';
import AdminUsers from '../../Components/Admin/AdminUsers';
import AdminBeats from '../../Components/Admin/AdminBeats';
import AdminSales from '../../Components/Admin/AdminSales';
import AdminAnalytics from '../../Components/Admin/AdminAnalytics';
import AdminSettings from '../../Components/Admin/AdminSettings';
import AdminWithdrawals from '../../Components/Admin/AdminWithdrawals';
import API from '../../api/api';
import styles from '../../css/Admin/AdminDashboard.module.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch user data
        const userResponse = await API.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Check if user is admin
        if (userResponse.data.role !== "admin") {
          navigate("/dashboard");
          return;
        }

        setUser(userResponse.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Failed to load admin dashboard. Please try again later.");
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [navigate]);

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <AdminUsers />;
      case 'beats':
        return <AdminBeats />;
      case 'sales':
        return <AdminSales />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'settings':
        return <AdminSettings />;
        case 'withdrawals': 
        return <AdminWithdrawals />;
      default:
        return <AdminOverview />;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.adminContainer}>
      <AdminSidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Admin Dashboard</h1>
          <div className={styles.userInfo}>
            <span>{user?.name}</span>
          </div>
        </div>
        <div className={styles.contentArea}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;