// frontend/src/Components/Admin/AdminSidebar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaMusic, 
  FaChartLine, 
  FaShoppingCart, 
  FaCog, 
  FaTachometerAlt,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaIdCard,
  FaStar,
  FaGraduationCap
} from 'react-icons/fa';
import styles from '../../css/Admin/AdminSidebar.module.css';
import Logo from '../../Assets/DHUUN.png';


const AdminSidebar = ({ activeSection, setActiveSection }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <FaTachometerAlt /> },
    { id: 'users', label: 'Users', icon: <FaUsers /> },
    { id: 'beats', label: 'Beats', icon: <FaMusic /> },
    { id: 'sales', label: 'Sales', icon: <FaShoppingCart /> },
    { id: 'reviews', label: 'Reviews', icon: <FaStar /> },
    { id: 'creator-resources', label: 'Creator Resources', icon: <FaGraduationCap /> }, 
    { id: 'verifications', label: 'Document Verification', icon: <FaIdCard /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <FaMoneyBillWave /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <img src={Logo} alt="Dhuun Logo" style={{ cursor: "pointer", width: "100px", height: "auto" }}/>
        
        {/* <h3>Admin Panel</h3> */}
      </div>

      <nav className={styles.navigation}>
        <ul>
          {menuItems.map((item) => (
            <li 
              key={item.id}
              className={activeSection === item.id ? styles.active : ''}
              onClick={() => setActiveSection(item.id)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.logoutSection}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;