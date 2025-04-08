import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Make sure to import axios
import API from "../api/api";
import styles from "../css/EditProfile.module.css";
import { FaSave, FaUserCircle, FaUpload } from "react-icons/fa";

const EditProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: "",
    username: "",
    email: "",
    phonenumber: "",
    bio: "",
    socialLinks: {
      instagram: "",
      twitter: "",
      soundcloud: "",
      youtube: ""
    },
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch user profile data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        setLoading(true);
        const response = await API.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Fetched user data:", response.data);

        // Update the state with user data
        setUserProfile({
          name: response.data.name || "",
          username: response.data.username || "",
          email: response.data.email || "",
          phonenumber: response.data.phonenumber || "",
          bio: response.data.bio || "",
          socialLinks: {
            instagram: response.data.socialLinks?.instagram || "",
            twitter: response.data.socialLinks?.twitter || "",
            soundcloud: response.data.socialLinks?.soundcloud || "",
            youtube: response.data.socialLinks?.youtube || ""
          },
        });

        // If user has an avatar, set the preview
        if (response.data.avatar) {
          setAvatarPreview(response.data.avatar);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load profile data. Please try again.");
        setLoading(false);
      }
    };

    fetchUserProfile();
    
    // Cleanup previews on unmount
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [navigate]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested social links
    if (name.startsWith("social.")) {
      const socialNetwork = name.split(".")[1];
      setUserProfile({
        ...userProfile,
        socialLinks: {
          ...userProfile.socialLinks,
          [socialNetwork]: value
        }
      });
    } else {
      // Handle regular fields
      setUserProfile({
        ...userProfile,
        [name]: value,
      });
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Log file details for debugging
      console.log("Selected file:", file.name, file.type, file.size);
      
      // Add file size validation
      if (file.size > 2 * 1024 * 1024) { // 2MB max
        setError("Image file size must be less than 2MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }
      
      // Clean up previous preview URL if it exists
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);
      
      // Create formData for multipart form submission
      const formData = new FormData();
      formData.append("name", userProfile.name);
      formData.append("username", userProfile.username);
      formData.append("phonenumber", userProfile.phonenumber);
      formData.append("bio", userProfile.bio);
      
      // Add social links
      Object.entries(userProfile.socialLinks).forEach(([key, value]) => {
        formData.append(`socialLinks[${key}]`, value);
      });
      
      // Add avatar if a new one was selected
      if (avatar) {
        // Explicitly add as File object with filename
        formData.append("avatar", avatar, avatar.name);
        console.log("Adding file to form data:", avatar.name, avatar.type, avatar.size);
      }

      // Log form data entries for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`FormData: ${key} = ${value instanceof File ? `File: ${value.name}` : value}`);
      }

      // Use axios directly instead of your API helper to ensure proper configuration
      const apiBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
      const response = await axios.put(
        `${apiBaseUrl}/api/profile/update`, 
        formData, 
        {
          headers: { 
            Authorization: `Bearer ${token}`
            // DO NOT set Content-Type header for multipart/form-data
          },
        }
      );

      console.log("Profile update response:", response.data);
      setSuccessMessage("Profile updated successfully!");
      
      // If there's a new avatar URL in the response, update the preview
      if (response.data.user && response.data.user.avatar) {
        setAvatarPreview(response.data.user.avatar);
        
        // Update localStorage user data with the new avatar URL
        const userData = JSON.parse(localStorage.getItem("user") || "{}");
        userData.name = userProfile.name;
        userData.username = userProfile.username;
        userData.avatar = response.data.user.avatar; // <-- This is crucial for the dashboard!
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Update any global state if you have one (for example, if using Context API)
        // userContext.updateUser({ ...userData });
      }
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userProfile.name) {
    return <div className={styles.loadingContainer}>Loading profile...</div>;
  }

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.profileHeading}>Edit Profile</h2>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className={styles.profileForm}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            {avatarPreview ? (
              <img 
                src={avatarPreview} 
                alt="Profile" 
                className={styles.avatarImage} 
              />
            ) : (
              <FaUserCircle className={styles.avatarPlaceholder} />
            )}
            
            <label htmlFor="avatar" className={styles.avatarUploadButton}>
              <FaUpload /> Change Photo
            </label>
            <input
              type="file"
              id="avatar"
              accept="image/*"
              onChange={handleAvatarChange}
              className={styles.fileInput}
            />
          </div>
          <p className={styles.avatarHelp}>Upload a profile picture (max 2MB)</p>
        </div>
        
        {/* Rest of the form remains the same */}
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={userProfile.name}
              onChange={handleInputChange}
              placeholder="Your full name"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={userProfile.username}
              onChange={handleInputChange}
              placeholder="Your username"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={userProfile.email}
              onChange={handleInputChange}
              placeholder="Your email"
              disabled // Email should not be editable
            />
            <p className={styles.fieldHelp}>Email cannot be changed</p>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="phonenumber">Phone Number</label>
            <input
              type="text"
              id="phonenumber"
              name="phonenumber"
              value={userProfile.phonenumber}
              onChange={handleInputChange}
              placeholder="Your phone number"
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={userProfile.bio}
            onChange={handleInputChange}
            placeholder="Tell us a bit about yourself"
            rows="4"
          ></textarea>
        </div>
        
        <h3 className={styles.sectionHeading}>Social Media Links</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="instagram">
              <span className={styles.socialIcon}>📸</span> Instagram
            </label>
            <input
              type="text"
              id="instagram"
              name="social.instagram"
              value={userProfile.socialLinks.instagram}
              onChange={handleInputChange}
              placeholder="Your Instagram handle"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="twitter">
              <span className={styles.socialIcon}>🐦</span> Twitter
            </label>
            <input
              type="text"
              id="twitter"
              name="social.twitter"
              value={userProfile.socialLinks.twitter}
              onChange={handleInputChange}
              placeholder="Your Twitter handle"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="soundcloud">
              <span className={styles.socialIcon}>🎵</span> SoundCloud
            </label>
            <input
              type="text"
              id="soundcloud"
              name="social.soundcloud"
              value={userProfile.socialLinks.soundcloud}
              onChange={handleInputChange}
              placeholder="Your SoundCloud profile"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="youtube">
              <span className={styles.socialIcon}>📺</span> YouTube
            </label>
            <input
              type="text"
              id="youtube"
              name="social.youtube"
              value={userProfile.socialLinks.youtube}
              onChange={handleInputChange}
              placeholder="Your YouTube channel"
            />
          </div>
        </div>
        
        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={loading}
          >
            {loading ? "Saving..." : (
              <>
                <FaSave /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;