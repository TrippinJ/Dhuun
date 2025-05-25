import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/api";
import styles from "../css/Login.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [token, setToken] = useState("");
  const [validatingToken, setValidatingToken] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract and validate token from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const resetToken = searchParams.get("token");
    
    if (!resetToken) {
      setMessage({ 
        type: "error", 
        text: "Invalid reset link. Please request a new password reset." 
      });
      setValidatingToken(false);
    } else {
      setToken(resetToken);
      setValidatingToken(false);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long" });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    
    if (!token) {
      setMessage({ type: "error", text: "Invalid reset token" });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ type: "", text: "" });
      
      // Call API to reset password
      const response = await API.post("/api/auth/reset-password", {
        token,
        password
      });
      
      setMessage({ 
        type: "success", 
        text: "Your password has been reset successfully! Redirecting to login..." 
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to reset password. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validatingToken) {
    return (
      <div className={styles.wrapper}>
        <div className={`${styles.formBox} ${styles.login}`}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button className={styles.iconClose} onClick={() => navigate("/")}>
        ✕
      </button>
      <div className={`${styles.formBox} ${styles.login}`}>
        <h2>Reset Password</h2>
        <p className={styles.forgotPasswordInfo}>
          Enter your new password below
        </p>
        
        {message.text && (
          <div className={message.type === "error" ? styles.errorMessage : styles.successMessage}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputBox}>
            <span className={styles.icon}>
              <ion-icon name="lock-closed"></ion-icon>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!token}
            />
            <label>New Password</label>
            <span 
              className={styles.togglePassword} 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          
          <div className={styles.inputBox}>
            <span className={styles.icon}>
              <ion-icon name="lock-closed"></ion-icon>
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!token}
            />
            <label>Confirm Password</label>
            <span 
              className={styles.togglePassword} 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          
          <button 
            type="submit" 
            className={styles.btn}
            disabled={isSubmitting || !token}
          >
            {isSubmitting ? "Updating..." : "Reset Password"}
          </button>
        </form>
        
        {!token && (
          <div className={styles.loginRegister}>
            <p>
              <Link to="/forgot-password" className={styles.loginLink}>
                ← Request new reset link
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;