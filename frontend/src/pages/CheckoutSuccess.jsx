import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../css/CheckoutSuccess.module.css";
import { FaDownload, FaArrowRight, FaHome, FaInbox, FaCheck, FaTimes } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import API from "../api/api";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Confetti effect state
  const [showConfetti, setShowConfetti] = useState(false);

  // Get cart items for display
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
  }, []);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get URL parameters from Khalti redirect
        const params = new URLSearchParams(window.location.search);
        const returnedPidx = params.get("pidx");
        const status = params.get("status");

        // Only proceed if we have a pidx in the URL (returned from Khalti)
        if (!returnedPidx) return;

        setVerifyingPayment(true);
        setLoading(true);

        // Get stored values from localStorage
        const storedPidx = localStorage.getItem("pidx");
        const pendingOrderData = JSON.parse(localStorage.getItem("pendingOrder") || "null");

        console.log("Payment return detected:", {
          returnedPidx,
          status,
          storedPidx,
          pendingOrderData
        });

        // Basic validation
        if (returnedPidx !== storedPidx || !pendingOrderData) {
          setError("Invalid payment session. Please try again.");
          setVerifyingPayment(false);
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // Step 1: Verify payment with backend
        const verifyResponse = await API.post(
          "/api/orders/verify-payment",
          { pidx: returnedPidx },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Payment verification response:", verifyResponse.data);

        if (verifyResponse.data.success) {
          // Step 2: Create order if payment verification was successful
          const orderData = {
            items: pendingOrderData.items,
            totalAmount: pendingOrderData.totalAmount,
            paymentMethod: "khalti",
            paymentId: verifyResponse.data.transaction_id,
            paymentPidx: returnedPidx
          };

          try {
            const orderResponse = await API.post(
              "/api/orders",
              orderData,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Order created successfully:", orderResponse.data);

            // Set success state
            setOrderDetails({
              orderId: orderResponse.data.orderId,
              items: pendingOrderData.items,
              totalAmount: pendingOrderData.totalAmount
            });

            setSuccessMessage("Your order has been processed successfully!");
            setPaymentStatus("Completed");

            // Show confetti for a good experience
            setShowConfetti(true);

            // Clear cart and pending order data
            localStorage.setItem("cart", "[]");
            localStorage.removeItem("pendingOrder");
            localStorage.removeItem("pidx");
          } catch (orderError) {
            console.error("Error creating order:", orderError);
            setError("Payment was successful, but we couldn't create your order. Please contact support.");
            setPaymentStatus("Completed");
          }
        } else {
          // Payment verification failed
          setError("Payment verification failed. Please try again or contact support.");
          setPaymentStatus("Failed");
        }

        // Clean up URL parameters
        window.history.replaceState({}, document.title, "/checkout-success");
      } catch (error) {
        console.error("Error processing payment return:", error);
        setError("Failed to process payment. Please contact support.");
        setPaymentStatus("Error");
      } finally {
        setVerifyingPayment(false);
        setLoading(false);
      }
    };

    // Execute payment return handler
    processPayment();

    // Hide confetti after 5 seconds if shown
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location, navigate, showConfetti]);

  if (loading) {
    return (
      <div className={styles.successContainer}>
        <NavbarBeatExplore />
        <div className={styles.successContent}>
          <div className={styles.loadingMessage}>
            <div className={styles.loadingSpinner}></div>
            <p>Processing your payment...</p>
          </div>
        </div>
      </div>
    );
  }

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
          {paymentStatus === "Completed" ? (
            <>
              <div className={styles.successIcon}><FaCheck /></div>
              <h1>Thank You for Your Purchase!</h1>
              {orderDetails && <p className={styles.orderNumber}>Order #{orderDetails.orderId || orderDetails._id}</p>}
            </>
          ) : paymentStatus === "Pending" ? (
            <>
              <div className={`${styles.successIcon} ${styles.pendingIcon}`}>...</div>
              <h1>Payment Pending</h1>
              <p>Your payment is being processed</p>
            </>
          ) : (
            <>
              <div className={`${styles.successIcon} ${styles.errorIcon}`}><FaTimes /></div>
              <h1>Payment Failed</h1>
              <p>We couldn't complete your payment</p>
            </>
          )}

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
              <span className={
                paymentStatus === "Completed" ? styles.statusSuccess :
                  paymentStatus === "Pending" ? styles.statusPending :
                    styles.statusFailed
              }>
                {paymentStatus}
              </span>
            </div>
          </div>

          {paymentStatus === "Completed" && cartItems.length > 0 && (
            <div className={styles.purchasedItems}>
              <h2>Your Purchased Beats</h2>
              <div className={styles.itemsList}>
                {cartItems.map((item, index) => (
                  <div key={index} className={styles.purchasedItem}>
                    <img
                      src={item.coverImage || "/default-cover.jpg"}
                      alt={item.title}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemDetails}>
                      <h3>{item.title}</h3>
                      <p>{item.licenseName || item.selectedLicense || 'Basic License'}</p>
                      <p className={styles.itemPrice}>
                        ${(item.licensePrice || item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalAmount}>
                <span>Total:</span>
                <span>
                  ${cartItems.reduce((sum, item) =>
                    sum + (item.licensePrice || item.price), 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {paymentStatus === "Completed" ? (
            <p className={styles.successMessage}>
              Your payment has been processed successfully. You can now download your beats
              or continue exploring our marketplace.
            </p>
          ) : paymentStatus === "Pending" ? (
            <p className={styles.pendingMessage}>
              Your payment is being processed. We'll update you once the payment is confirmed.
              This may take a few minutes.
            </p>
          ) : (
            <p className={styles.errorMessage}>
              We couldn't complete your payment. Please try again or use a different payment method.
            </p>
          )}

          {paymentStatus === "Completed" && (
            <div className={styles.nextSteps}>
              <div className={styles.stepItem}>
                <div className={styles.stepIcon}>
                  <FaInbox />
                </div>
                <p>A confirmation email has been sent to your registered email address</p>
              </div>
            </div>
          )}

          <div className={styles.actionButtons}>
            {paymentStatus === "Completed" ? (
              <>
                <button
                  className={`${styles.actionButton} ${styles.downloadButton}`}
                  onClick={() => navigate("/dashboard/purchased")}
                >
                  <FaDownload /> Download My Beats
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => navigate("/BeatExplorePage")}
                >
                  Continue Shopping <FaArrowRight />
                </button>
              </>
            ) : (
              <>
                <button
                  className={`${styles.actionButton} ${styles.retryButton}`}
                  onClick={() => navigate("/cart")}
                >
                  Return to Cart
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => navigate("/BeatExplorePage")}
                >
                  Continue Shopping <FaArrowRight />
                </button>
              </>
            )}

            <button
              className={styles.actionButton}
              onClick={() => navigate("/")}
            >
              <FaHome /> Return to Home
            </button>
          </div>

          {/* Add recovery options for failed payments */}
          {paymentStatus === "Failed" && (
            <div className={styles.recoveryOptions}>
              <h3>Payment Failed</h3>
              <p>We couldn't complete your payment. You can:</p>
              <div className={styles.recoveryButtons}>
                <button
                  className={styles.retryButton}
                  onClick={() => navigate("/cart")}
                >
                  Return to Cart
                </button>
                <button
                  className={styles.supportButton}
                  onClick={() => window.location.href = "mailto:support@dhuun.com"}
                >
                  Contact Support
                </button>
              </div>
            </div>
          )}
          
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