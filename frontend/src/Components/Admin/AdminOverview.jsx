// frontend/src/Components/Admin/AdminOverview.jsx
import React, { useState, useEffect } from 'react';
import { FaUsers, FaMusic, FaShoppingCart, FaRupeeSign } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminOverview.module.css';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBeats: 0,
    totalSales: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    newBeatsToday: 0,
    salesPercentage: 0,
    revenuePercentage: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch from your API
        try {
          const response = await API.get('/api/admin/dashboard');
          setStats(response.data.stats || {});
          
          // If you have a recent activity endpoint, you'd fetch that here too
        } catch (apiError) {
          console.error('API error:', apiError);
          
          // Fallback data for development
          setStats({
            totalUsers: 248,
            totalBeats: 1025,
            totalSales: 356,
            totalRevenue: 8754.32,
            newUsersToday: 12,
            newBeatsToday: 8,
            salesPercentage: 15,
            revenuePercentage: 23
          });
        }
        
        // Set some sample recent activity
        setRecentActivity([
          { type: 'user', action: 'New user registered', details: 'John Doe joined as a seller', time: '2 hours ago' },
          { type: 'beat', action: 'New beat uploaded', details: '"Summer Vibes" by DJ Beats', time: '5 hours ago' },
          { type: 'sale', action: 'New purchase', details: '"Trap Nation" purchased by user456', time: '1 day ago' },
          { type: 'user', action: 'User upgraded plan', details: 'Producer123 upgraded to Pro plan', time: '2 days ago' }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching overview data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchOverviewData();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading overview data...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.overviewContainer}>
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaUsers />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Users</h3>
            <div className={styles.statValue}>{stats.totalUsers}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaMusic />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Beats</h3>
            <div className={styles.statValue}>{stats.totalBeats}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaShoppingCart />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Sales</h3>
            <div className={styles.statValue}>{stats.totalSales}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaRupeeSign />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Revenue</h3>
            <div className={styles.statValue}>Rs {stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      <div className={styles.recentActivity}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          {recentActivity.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityIcon}>
                {activity.type === 'user' && <FaUsers />}
                {activity.type === 'beat' && <FaMusic />}
                {activity.type === 'sale' && <FaShoppingCart />}
              </div>
              <div className={styles.activityInfo}>
                <div className={styles.activityTitle}>{activity.action}</div>
                <div className={styles.activityDesc}>{activity.details}</div>
                <div className={styles.activityTime}>{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;