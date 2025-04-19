// frontend/src/Components/Admin/AdminAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { FaUsers, FaMusic, FaShoppingCart, FaDollarSign, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import API from '../../api/api';
import styles from '../../css/Admin/AdminAnalytics.module.css';

const AdminAnalytics = () => {
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
  const [salesData, setSalesData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/admin/analytics?timeRange=${timeRange}`);
      setStats(response.data.stats);
      setSalesData(response.data.salesData);
      setUserGrowthData(response.data.userGrowthData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
      setLoading(false);
      
      // Set fallback demo data
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
      
      setSalesData([
        { name: 'Jan', sales: 24, revenue: 499 },
        { name: 'Feb', sales: 35, revenue: 678 },
        { name: 'Mar', sales: 42, revenue: 864 },
        { name: 'Apr', sales: 38, revenue: 721 },
        { name: 'May', sales: 50, revenue: 1024 },
        { name: 'Jun', sales: 47, revenue: 962 },
        { name: 'Jul', sales: 59, revenue: 1287 },
        { name: 'Aug', sales: 63, revenue: 1465 },
      ]);
      
      setUserGrowthData([
        { name: 'Jan', users: 57 },
        { name: 'Feb', users: 78 },
        { name: 'Mar', users: 95 },
        { name: 'Apr', users: 112 },
        { name: 'May', users: 132 },
        { name: 'Jun', users: 189 },
        { name: 'Jul', users: 212 },
        { name: 'Aug', users: 248 },
      ]);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading analytics...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.analyticsHeader}>
        <h2>Dashboard Overview</h2>
        <div className={styles.timeFilter}>
          <button 
            className={`${styles.timeButton} ${timeRange === 'week' ? styles.active : ''}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={`${styles.timeButton} ${timeRange === 'month' ? styles.active : ''}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button 
            className={`${styles.timeButton} ${timeRange === 'year' ? styles.active : ''}`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaUsers />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Users</h3>
            <div className={styles.statValue}>{stats.totalUsers}</div>
            <div className={`${styles.statChange} ${stats.newUsersToday > 0 ? styles.positive : styles.negative}`}>
              {stats.newUsersToday > 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{stats.newUsersToday} today</span>
            </div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaMusic />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Beats</h3>
            <div className={styles.statValue}>{stats.totalBeats}</div>
            <div className={`${styles.statChange} ${stats.newBeatsToday > 0 ? styles.positive : styles.negative}`}>
              {stats.newBeatsToday > 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{stats.newBeatsToday} today</span>
            </div>
          </div>
        </div>

        // Continuing frontend/src/Components/Admin/AdminAnalytics.jsx
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaShoppingCart />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Sales</h3>
            <div className={styles.statValue}>{stats.totalSales}</div>
            <div className={`${styles.statChange} ${stats.salesPercentage > 0 ? styles.positive : styles.negative}`}>
              {stats.salesPercentage > 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(stats.salesPercentage)}% {timeRange}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaDollarSign />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Revenue</h3>
            <div className={styles.statValue}>${stats.totalRevenue.toFixed(2)}</div>
            <div className={`${styles.statChange} ${stats.revenuePercentage > 0 ? styles.positive : styles.negative}`}>
              {stats.revenuePercentage > 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(stats.revenuePercentage)}% {timeRange}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.chartsContainer}>
        <div className={styles.chartCard}>
          <h3>Sales & Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#7B2CBF" />
              <YAxis yAxisId="right" orientation="right" stroke="#FF1A1A" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sales" name="Sales" fill="#7B2CBF" />
              <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#FF1A1A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className={styles.chartCard}>
          <h3>User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={userGrowthData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                name="Users" 
                stroke="#7B2CBF" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          {/* This would normally be populated from API data */}
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <FaUsers />
            </div>
            <div className={styles.activityInfo}>
              <div className={styles.activityTitle}>New user registered</div>
              <div className={styles.activityDesc}>John Doe joined as a seller</div>
              <div className={styles.activityTime}>2 hours ago</div>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <FaMusic />
            </div>
            <div className={styles.activityInfo}>
              <div className={styles.activityTitle}>New beat uploaded</div>
              <div className={styles.activityDesc}>"Summer Vibes" by DJ Beats</div>
              <div className={styles.activityTime}>5 hours ago</div>
            </div>
          </div>
          
          <div className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <FaShoppingCart />
            </div>
            <div className={styles.activityInfo}>
              <div className={styles.activityTitle}>New purchase</div>
              <div className={styles.activityDesc}>"Trap Nation" purchased by user456</div>
              <div className={styles.activityTime}>1 day ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;