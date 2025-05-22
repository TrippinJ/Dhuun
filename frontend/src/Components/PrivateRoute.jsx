import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isLoggedIn, loading, user } = useAuth();
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#f0f0f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              border: '4px solid rgba(255, 186, 0, 0.1)',
              borderLeftColor: '#ffba00',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}
          />
          <p>Verifying authentication...</p>
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional: Check for admin role if adminOnly flag is true
  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if authenticated (and has admin role if required)
  return children;
};

export default PrivateRoute;