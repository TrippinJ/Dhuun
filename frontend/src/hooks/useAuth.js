
import { useState, useEffect } from 'react';
import API from '../api/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      const response = await API.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data) {
        setUser(response.data);
        setIsLoggedIn(true);
        
        // Update localStorage with latest data
        localStorage.setItem("user", JSON.stringify(response.data));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Try from localStorage first for quick display
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing stored user:", e);
      }
    }
    
    // Then fetch fresh data
    fetchUserData();
  }, []);
  
  return { user, isLoading, isLoggedIn, refreshUser: fetchUserData };
}