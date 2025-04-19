import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080",
  // headers: {
  //   "Content-Type": "application/json",
  // },
});

// Add request interceptor for authorization and logging
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log outgoing requests in development
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle token expiration
    if (error.response?.status === 401) {
      console.warn("Authentication error - clearing token");
      localStorage.removeItem("token");
      // Don't redirect automatically to avoid loops
      // window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get profile
API.getUserProfile = async function() {
  try {
    const response = await this.get("/api/profile");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to get profile by username
API.getProfileByUsername = async function(username) {
  try {
    const response = await this.get(`/api/profile/user/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Helper function to update profile
API.updateUserProfile = async function(profileData) {
  try {
    const formData = new FormData();
    
    Object.keys(profileData).forEach(key => {
      if (key === 'avatar' && profileData[key] instanceof File) {
        formData.append('avatar', profileData[key]);
        console.log(`Adding file: ${profileData[key].name}, size: ${profileData[key].size}`);
      } else if (key === 'socialLinks' && typeof profileData[key] === 'object') {
        const socialLinks = profileData[key];
        Object.keys(socialLinks).forEach(social => {
          formData.append(`socialLinks[${social}]`, socialLinks[social]);
        });
      } else if (key !== 'avatar') {
        formData.append(key, profileData[key]);
      }
    });
    
    // Debug formData contents
    if (import.meta.env.DEV) {
      for (let [key, value] of formData.entries()) {
        console.log(`FormData: ${key} = ${value instanceof File ? `File: ${value.name}` : value}`);
      }
    }
    
    const response = await this.put("/api/profile", formData, {
      headers: { 
        // Let axios set the content type with boundary
      }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default API;