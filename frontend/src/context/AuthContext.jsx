// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/api';
import { useNavigate } from 'react-router-dom';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize auth state on app load
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          // No token found
          setIsLoggedIn(false);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Verify token with backend
        try {
          const response = await API.get("/api/auth/verify", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Token is valid, set user data
          const storedUser = JSON.parse(localStorage.getItem("user") || "null");
          setUser(storedUser);
          setIsLoggedIn(true);
          console.log("Auth verification successful");
        } catch (verifyError) {
          console.error("Token verification failed:", verifyError);
          // Clear invalid auth data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    verifyAuth();
  }, []);
  
  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await API.post("/api/auth/login", { email, password });
      
      const { token, user } = response.data;
      
      // Save to localStorage (keeping your existing pattern)
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Update state
      setIsLoggedIn(true);
      setUser(user);
      setError(null);
      
      return { success: true, user };
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
      return { 
        success: false, 
        error: error.response?.data?.message || "Login failed" 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear cart and other user data if needed
    // localStorage.removeItem("cart");
    // localStorage.removeItem("wishlist");
    
    // Update state
    setIsLoggedIn(false);
    setUser(null);
  };
  
  // Google login function (if you're using it)
  const googleLogin = async (googleData) => {
    try {
      setLoading(true);
      const response = await API.post("/api/auth/google-login", googleData);
      
      const { token, user } = response.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      setIsLoggedIn(true);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      setError("Google login failed");
      return { success: false, error: "Google login failed" };
    } finally {
      setLoading(false);
    }
  };
  
  // Context value
  const value = {
    user,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    googleLogin
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);