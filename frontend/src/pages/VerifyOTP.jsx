// frontend/src/pages/VerifyOTP.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../css/VerifyOTP.module.css"; // You'll need to create this CSS file
import API from "../api/api";
import { FaEnvelope, FaKey, FaArrowRight } from "react-icons/fa";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get email from location state or localStorage
    const userEmail = location.state?.email || localStorage.getItem("pendingVerificationEmail");
    if (userEmail) {
      setEmail(userEmail);
      localStorage.setItem("pendingVerificationEmail", userEmail); // Store for persistence
    } else {
      // No email found, redirect to login
      navigate("/login");
    }

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await API.post("/api/auth/verify-otp", {
        email,
        otp
      });

      console.log("Verification successful:", response.data);

      // Store token and user data
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      
      // Remove the pending verification email
      localStorage.removeItem("pendingVerificationEmail");

      // Navigate based on role
      if (response.data.user.role === "seller") {
        navigate("/dashboard");
      } else {
        navigate("/BeatExplorePage");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setErrorMessage(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await API.post("/api/auth/resend-otp", { email });
      
      // Reset the timer
      setTimeLeft(600);
      
      alert("A new verification code has been sent to your email.");
    } catch (error) {
      console.error("Resend OTP error:", error);
      setErrorMessage(error.response?.data?.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.verifyBox}>
        <h2>Verify Your Email</h2>
        <p className={styles.instructions}>
          We've sent a verification code to <strong>{email}</strong>
        </p>
        
        <form onSubmit={handleVerify} className={styles.verifyForm}>
          <div className={styles.inputGroup}>
            <div className={styles.otpInput}>
              <FaKey className={styles.inputIcon} />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>
          </div>
          
          {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}
          
          <div className={styles.timerSection}>
            <p className={styles.timer}>
              Code expires in: <span>{formatTime(timeLeft)}</span>
            </p>
          </div>
          
          <button
            type="submit"
            className={styles.verifyButton}
            disabled={isLoading || timeLeft === 0}
          >
            {isLoading ? "Verifying..." : "Verify Code"} {!isLoading && <FaArrowRight />}
          </button>
        </form>
        
        <div className={styles.resendSection}>
          <p>Didn't receive a code?</p>
          <button
            type="button"
            className={styles.resendButton}
            onClick={handleResendOTP}
            disabled={isLoading || timeLeft > 540} // Only allow resend after 1 minute
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;