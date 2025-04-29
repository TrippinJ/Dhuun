import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/Login.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [resetToken, setResetToken] = useState(null); // Make sure this is declared
  const [resetLink, setResetLink] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address" });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage({ type: "", text: "" });

      // Call the API to request password reset
      const response = await API.post("/api/auth/forgot-password", { email });
      
      // In development mode, we'll get back the token directly
      if (response.data.devToken) {
        setResetToken(response.data.devToken);
        setResetLink(response.data.resetLink || "");
      }
      
      setMessage({ 
        type: "success", 
        text: response.data.message || "If a user with that email exists, a password reset link has been sent." 
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage({ 
        type: "error", 
        text: "An error occurred. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.iconClose} onClick={() => navigate("/")}>
        ✕
      </button>
      <div className={`${styles.formBox} ${styles.login}`}>
        <h2>Forgot Password</h2>
        <p className={styles.forgotPasswordInfo}>
          Enter your email address and we'll send you instructions to reset your password.
        </p>
        
        {message.text && (
          <div className={message.type === "error" ? styles.errorMessage : styles.successMessage}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.inputBox}>
            <span className={styles.icon}>
              <ion-icon name="mail"></ion-icon>
            </span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email</label>
          </div>
          
          <button 
            type="submit" 
            className={styles.btn}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Reset Password"}
          </button>

          <div className={styles.loginRegister}>
            <p>
              Remember your password?{" "}
              <Link to="/login" className={styles.loginLink}>
                Log In
              </Link>
            </p>
          </div>
        </form>
        
        {/* Development-only section to display reset token */}
        {resetToken && (
          <div className={styles.devNotice}>
            <h3>Development Mode</h3>
            <p>In production, an email would be sent to the user.</p>
            <p>For testing, use this token to reset your password:</p>
            <code>{resetToken}</code>
            
            {resetLink && (
              <div>
                <p>Or click this link:</p>
                <a href={resetLink} className={styles.resetLink}>Reset Password Link</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;