import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:8080", // Backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Profile API functions
// These don't need to be exported directly as they'll be used by importing API

// Helper function to get profile
API.getUserProfile = async function() {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("Not authenticated");
  }
  
  try {
    const response = await this.get("/api/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Helper function to get profile by username
API.getProfileByUsername = async function(username) {
  try {
    const response = await this.get(`/api/profile/user/${username}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching profile for ${username}:`, error);
    throw error;
  }
};

// Helper function to update profile
API.updateUserProfile = async function(profileData) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("Not authenticated");
  }
  
  try {
    // Use FormData for file uploads
    const formData = new FormData();
    
    // Add text fields
    Object.keys(profileData).forEach(key => {
      if (key === 'avatar' && profileData[key] instanceof File) {
        formData.append('avatar', profileData[key]);
      } else if (key === 'socialLinks' && typeof profileData[key] === 'object') {
        // Handle social links
        Object.keys(profileData[key]).forEach(social => {
          formData.append(`socialLinks[${social}]`, profileData[key][social]);
        });
      } else if (key !== 'avatar' || typeof profileData[key] === 'string') {
        formData.append(key, profileData[key]);
      }
    });
    
    const response = await this.put("/api/profile", formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

export default API;