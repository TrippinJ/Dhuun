import React from 'react';
import { Link } from 'react-router-dom';

const AdminHeader = () => {
  return (
    <div className="admin-header">
      <h1>Admin Dashboard</h1>
      <div className="admin-header-actions">
        <nav className="admin-navbar">
          <Link to="/admin/users" className="nav-link">Users</Link>
          <Link to="/admin/beats" className="nav-link">Beats</Link>
          <Link to="/admin/sales" className="nav-link">Sales</Link>
          <Link to="/admin/analytics" className="nav-link">Analytics</Link>
          <Link to="/admin/settings" className="nav-link">Settings</Link>
        </nav>
        <button className="logout-btn">Logout</button>
      </div>
    </div>
  );
};

export default AdminHeader;
