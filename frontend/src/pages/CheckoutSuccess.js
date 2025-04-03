import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../css/CheckoutSuccess.module.css";
import { FaDownload, FaArrowRight } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = location.state || {};
  
  useEffect(() => {
    // If no orderId is provided, redirect to home
    if (!orderId) {
      navigate("/");
    }
    
    // Clean cart on successful purchase
    localStorage.setItem("cart", "[]");
  }, [orderId, navigate]);

  return (
    <div className={styles.successContainer}>
      <NavbarBeatExplore />
      
      <div className={styles.successContent}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h1>Thank You for Your Purchase!</h1>
          <p className={styles.orderNumber}>Order #{orderId}</p>
          <p className={styles.successMessage}>
            Your payment has been processed successfully. You can now download your beats
            or continue exploring our marketplace.
          </p>
          
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.actionButton} ${styles.downloadButton}`}
              onClick={() => navigate("/dashboard")}
            >
              <FaDownload /> Download My Beats
            </button>
            <button 
              className={styles.actionButton}
              onClick={() => navigate("/BeatExplorePage")}
            >
              Continue Shopping <FaArrowRight />
            </button>
          </div>
          
          <p className={styles.helpText}>
            Need help with your purchase? Contact our support team at
            <a href="mailto:support@dhuun.com"> support@dhuun.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;