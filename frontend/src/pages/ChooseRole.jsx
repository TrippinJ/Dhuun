// In frontend/src/pages/ChooseRole.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/ChooseRole.module.css";
import { FaUser, FaUserTie } from "react-icons/fa";
import Logo from "../Assets/DHUUN.png";
import API from "../api/api";

const ChooseRole = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle role selection
  const handleRoleSelection = async (role) => {
    // Check if there's a token (user is authenticated)
    const token = localStorage.getItem("token");
    
    if (!token) {
      // If not logged in, redirect to register with role as query param
      navigate(`/login?role=${role}`);
      return;
    }
    
    // User is logged in via Google, update their role
    try {
      setIsLoading(true);
      setError("");
      
      console.log(`Updating role to: ${role}`);
      
      // Call the backend API to update role
      const response = await API.post(
        "/api/auth/update-role", 
        { role },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Role update response:", response.data);
      
      // Update the user object in localStorage with new role
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.role = role;
      localStorage.setItem("user", JSON.stringify(user));
      
      // Redirect based on the selected role
      if (role === "seller") {
        navigate("/dashboard");
      } else {
        navigate("/BeatExplorePage");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setError(error.response?.data?.message || "Failed to update role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.roleContainer}>
      <div className={styles.content}>
        <img
          src={Logo}
          alt="Dhuun Logo"
          className={styles.logo}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
        <h1>Welcome To Dhuun</h1>
        <p>"Where words fail, music speaks" - Hans Christian Andersen</p>
        
        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.roleCards}>
          <div
            className={styles.roleCard}
            onClick={() => !isLoading && handleRoleSelection("buyer")}
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "default" : "pointer" }}
          >
            <FaUser className={styles.icon} />
            <h3>Buy Beats</h3>
            <p>Purchase high-quality beats from producers worldwide.</p>
          </div>

          <div
            className={styles.roleCard}
            onClick={() => !isLoading && handleRoleSelection("seller")}
            style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? "default" : "pointer" }}
          >
            <FaUserTie className={styles.icon} />
            <h3>Sell Beats</h3>
            <p>Upload and sell your beats to artists worldwide.</p>
          </div>
        </div>
        
        {isLoading && <div className={styles.loading}>Processing your selection...</div>}
      </div>
    </div>
  );
};

export default ChooseRole;