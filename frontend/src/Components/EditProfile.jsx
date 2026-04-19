import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/EditProfile.module.css";
import { FaSave, FaUserCircle, FaUpload, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, loading: authLoading, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!isLoggedIn && !authLoading) {
      navigate("/login");
      return;
    }

    if (user) {
      setUserProfile({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        phonenumber: user.phonenumber || "",
        bio: user.bio || "",
      });

      if (user.avatar) setAvatarPreview(user.avatar);
    }

    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [user, isLoggedIn, authLoading, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserProfile({ ...userProfile, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image file size must be less than 2MB");
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      return;
    }

    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");

    try {
      if (!isLoggedIn) {
        navigate("/login");
        return;
      }

      setLoading(true);

      const formData = new FormData();
      formData.append("name", userProfile.name);
      formData.append("username", userProfile.username);
      formData.append("phonenumber", userProfile.phonenumber);
      formData.append("bio", userProfile.bio);

      if (avatar) {
        formData.append("avatar", avatar, avatar.name);
      }

      // Use API instead of raw axios — interceptor handles auth + FormData content-type
      const response = await API.put("/api/profile/update", formData);

      if (response.data.user) {
        if (response.data.user.avatar) {
          setAvatarPreview(response.data.user.avatar);
        }

        // Update AuthContext state — no localStorage write needed
        updateUser({ ...user, ...response.data.user });

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

  const openDeleteModal = () => setShowDeleteModal(true);
  const closeDeleteModal = () => setShowDeleteModal(false);

  const handleDeleteAccount = async () => {
    try {
      if (!isLoggedIn) {
        navigate("/login");
        return;
      }

      setDeleteLoading(true);

      // Use API instead of raw axios — interceptor handles auth header
      await API.delete("/api/auth/delete-account");

      alert("Your account has been successfully deleted.");

      // Use AuthContext logout — clears tokens, state, and cart properly
      await logout();

      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setError(error.response?.data?.message || "Failed to delete account. Please try again.");
      setDeleteLoading(false);
      closeDeleteModal();
    }
  };

  if (authLoading || (loading && !userProfile.name)) {
    return <div className={styles.loadingContainer}>Loading profile...</div>;
  }

  return (
    <>
      <div className={styles.profileContainer}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

        <form onSubmit={handleSubmit} className={styles.profileForm}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className={styles.avatarImage} />
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
                disabled
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
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? "Saving..." : <><FaSave /> Save Changes</>}
            </button>

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