import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api/api";
import styles from "../css/EditProfile.module.css";
import { FaSave, FaUserCircle, FaUpload, FaTrash, FaExclamationTriangle } from "react-icons/fa";


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
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    
    // Handle regular fields
    setUserProfile({
      ...userProfile,
      [name]: value,
    });
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
      const apiBaseUrl = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:8080";
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
    
    // After successful update
    if (response.data.user) {
      // Update avatar preview if available
      if (response.data.user.avatar) {
        setAvatarPreview(response.data.user.avatar);
      }
      
      // Update localStorage with all user data
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event("profileUpdated"));
      
      setSuccessMessage("Profile updated successfully!");
    }
    
  } catch (error) {
    console.error("Error updating profile:", error);
    setError(error.response?.data?.message || "Failed to update profile. Please try again.");
  } finally {
    setLoading(false);
  }
};

  // Open delete confirmation modal
  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      // Call the delete account endpoint
      const apiBaseUrl = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:8080";
      await axios.delete(
        `${apiBaseUrl}/api/auth/delete-account`, 
        {
          headers: { 
            Authorization: `Bearer ${token}`
          },
        }
      );

      // Show success message
      alert("Your account has been successfully deleted.");
      
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to homepage
      navigate("/");
      
    } catch (error) {
      console.error("Error deleting account:", error);
      setError(error.response?.data?.message || "Failed to delete account. Please try again.");
      setDeleteLoading(false);
      closeDeleteModal();
    }
  };

  if (loading && !userProfile.name) {
    return <div className={styles.loadingContainer}>Loading profile...</div>;
  }
  
  return (
    <>
      <div className={styles.profileContainer}>
        {/* <h2 className={styles.profileHeading}>Edit Profile</h2> */}
        
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
            
            {/* Delete Account Button */}
            <button 
              type="button" 
              className={styles.deleteButton}
              onClick={openDeleteModal}
              disabled={loading}
            >
              <FaTrash /> Delete Account
            </button>
          </div>
        </form>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <FaExclamationTriangle className={styles.warningIcon} />
              <h3>Delete Your Account?</h3>
            </div>
            
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <p>All your data, including your profile, uploads, and purchase history will be permanently removed.</p>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmDeleteButton}
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfile;