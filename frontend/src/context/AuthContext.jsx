// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/api';

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
          
          // Token is valid, set user data from localStorage
          const storedUser = JSON.parse(localStorage.getItem("user") || "null");
          if (storedUser) {
            setUser(storedUser);
            setIsLoggedIn(true);
            console.log("Auth verification successful:", storedUser.role);
          } else {
            // Token valid but no stored user - clear everything
            localStorage.removeItem("token");
            setIsLoggedIn(false);
            setUser(null);
          }
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
      
      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Update state immediately
      setIsLoggedIn(true);
      setUser(user);
      setError(null);
      
      console.log("Login successful, auth state updated:", user.role);
      
      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      setError(errorMessage);
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Google login function
  const googleLogin = async (googleData) => {
    try {
      setLoading(true);
      const response = await API.post("/api/auth/google-login", googleData);
      
      const { token, user, isNewUser } = response.data;
      
      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Update state immediately
      setIsLoggedIn(true);
      setUser(user);
      setError(null);
      
      console.log("Google login successful, auth state updated:", user.role);
      
      return { success: true, user, isNewUser };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Google login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Update state
    setIsLoggedIn(false);
    setUser(null);
    setError(null);
    
    console.log("User logged out, auth state cleared");
  };
  
  // Update user state (for profile updates, etc.)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };
  
  // Context value
  const value = {
    user,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    googleLogin,
    updateUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};