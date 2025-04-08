import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
      
      // Create formData for multipart form submission (for file upload)
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
        formData.append("avatar", avatar);
      }

      // Make the API call to update profile
      const response = await API.put("/api/profile", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
      });

      setSuccessMessage("Profile updated successfully!");
      setLoading(false);
      
      // Update localStorage user data if needed
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.name = userProfile.name;
      userData.username = userProfile.username;
      localStorage.setItem("user", JSON.stringify(userData));
      
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to update profile. Please try again.");
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