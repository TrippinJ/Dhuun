import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/Login.module.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [emailSent, setEmailSent] = useState(false);
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
      
      setMessage({ 
        type: "success", 
        text: response.data.message || "Password reset link has been sent to your email address." 
      });
      
      setEmailSent(true);
    } catch (error) {
      console.error("Forgot password error:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "An error occurred. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setMessage({ type: "", text: "" });
    setEmail(""); // Clear the email field for a fresh start
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.iconClose} onClick={() => navigate("/")}>
        ✕
      </button>
      <div className={`${styles.formBox} ${styles.login}`}>
        {!emailSent ? (
          <>
            <h2>Forgot Password</h2>
            <p className={styles.forgotPasswordInfo}>
              Enter your email address for password reset link.
            </p>
            
            {message.text && message.type === "error" && (
              <div className={styles.errorMessage}>
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
                {isSubmitting ? "Sending..." : "Send Reset Link"}
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
          </>
        ) : (
          <div className={styles.emailSentContainer}>
            <div className={styles.emailSentIcon}>
              📧
            </div>
            <h2 className={styles.emailSentTitle}>Check your email</h2>
            <p className={styles.emailSentDescription}>
              Password reset link sent to
            
            <p className={styles.emailAddress}>{email}</p>
            </p>
            
            
            <div className={styles.emailSentActions}>
              <button 
                type="button"
                className={styles.btn}
                onClick={handleTryAgain}
              >
                Send Reset Link Again
              </button>
              
              <div className={styles.loginRegister}>
                <p>
                  <Link to="/login" className={styles.loginLink}>
                    Back to Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;