import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../css/CheckoutSuccess.module.css";
import { FaDownload, FaArrowRight, FaHome, FaInbox } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import API from "../api/api";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = location.state || {};
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Confetti effect state
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    // If no orderId is provided, redirect to home
    if (!orderId) {
      navigate("/");
      return;
    }
    
    // Clean cart on successful purchase
    localStorage.setItem("cart", "[]");
    
    // Fetch order details if possible
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await API.get(`/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrderDetails(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order details:", error);
        setError("Unable to load order details");
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
    
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [orderId, navigate]);

  return (
    <div className={styles.successContainer}>
      <NavbarBeatExplore />
      
      {/* Confetti effect */}
      {showConfetti && (
        <div className={styles.confetti}>
          {[...Array(50)].map((_, index) => (
            <div 
              key={index} 
              className={styles.confettiPiece} 
              style={{ 
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`
              }}
            />
          ))}
        </div>
      )}
      
      <div className={styles.successContent}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h1>Thank You for Your Purchase!</h1>
          <p className={styles.orderNumber}>Order #{orderId}</p>
          
          <div className={styles.orderDetails}>
            <div className={styles.detailsRow}>
              <span>Date:</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className={styles.detailsRow}>
              <span>Time:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <div className={styles.detailsRow}>
              <span>Payment Status:</span>
              <span className={styles.statusSuccess}>Completed</span>
            </div>
          </div>
          
          {orderDetails && orderDetails.items && (
            <div className={styles.purchasedItems}>
              <h2>Your Purchased Beats</h2>
              <div className={styles.itemsList}>
                {orderDetails.items.map((item, index) => (
                  <div key={index} className={styles.purchasedItem}>
                    {item.beat && (
                      <>
                        <img 
                          src={item.beat.coverImage || "/default-cover.jpg"} 
                          alt={item.beat.title} 
                          className={styles.itemImage} 
                        />
                        <div className={styles.itemDetails}>
                          <h3>{item.beat.title}</h3>
                          <p>{item.license} License</p>
                          <p className={styles.itemPrice}>${item.price}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              <div className={styles.totalAmount}>
                <span>Total:</span>
                <span>${orderDetails.totalAmount}</span>
              </div>
            </div>
          )}
          
          <p className={styles.successMessage}>
            Your payment has been processed successfully. You can now download your beats
            or continue exploring our marketplace.
          </p>
          
          <div className={styles.nextSteps}>
            <div className={styles.stepItem}>
              <div className={styles.stepIcon}>
                <FaInbox />
              </div>
              <p>A confirmation email has been sent to your registered email address</p>
            </div>
          </div>
          
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
            <button 
              className={styles.actionButton}
              onClick={() => navigate("/")}
            >
              <FaHome /> Return to Home
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