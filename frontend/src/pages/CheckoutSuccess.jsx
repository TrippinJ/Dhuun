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

  // Confetti effect state
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const processPayment = async () => {
      try {
        setLoading(true);

        // Get URL parameters - this is what Khalti sends back
        const params = new URLSearchParams(location.search);
        const pidx = params.get("pidx");
        const status = params.get("status");
        const transaction_id = params.get("transaction_id") || params.get("txnId");

        // If no pidx found, check if we have a state from react-router
        if (!pidx && location.state?.orderId) {
          // This is for direct navigation after an order was created
          try {
            // Fetch order details directly
            const token = localStorage.getItem("token");
            if (!token) {
              throw new Error("Authentication required");
            }

            const response = await API.get(`/api/orders/${location.state.orderId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            setOrderDetails(response.data);
            setPaymentStatus("Completed");
            setShowConfetti(true);
            setLoading(false);
            return;
          } catch (orderError) {
            console.error("Error fetching order:", orderError);
            setError("Unable to load order details");
            setLoading(false);
            return;
          }
        }

        // No pidx and no orderId, redirect to home
        if (!pidx) {
          console.error("No payment ID (pidx) found in URL");
          navigate("/");
          return;
        }

        console.log("Got Khalti callback:", { pidx, status, transaction_id });

        // Check status first
        if (status === "Completed") {
          // Get the pending order data from localStorage
          const pendingOrderData = JSON.parse(localStorage.getItem("pendingOrder") || "null");

          if (!pendingOrderData) {
            setError("Order information not found");
            setLoading(false);
            return;
          }

          // Verify payment with our backend
          const token = localStorage.getItem("token");
          if (!token) {
            setError("Authentication required");
            setLoading(false);
            return;
          }

          // First, verify the payment status
          const verifyResponse = await API.post("/api/payments/verify",
            { pidx },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (verifyResponse.data.success && verifyResponse.data.status === "Completed") {
            // Now create the actual order
            const orderData = {
              items: pendingOrderData.items,
              totalAmount: pendingOrderData.totalAmount,
              customerEmail: pendingOrderData.customerEmail,
              paymentMethod: "khalti",
              paymentId: transaction_id,
              paymentPidx: pidx
            };

            const orderResponse = await API.post("/api/orders", orderData, {
              headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Order created:", orderResponse.data);

            // Clear cart and pending order
            localStorage.setItem("cart", "[]");
            localStorage.removeItem("pendingOrder");

            // Set success state
            setOrderDetails({
              ...orderResponse.data,
              items: pendingOrderData.items.map(item => ({
                ...item,
                beat: cartItems.find(cartItem => cartItem._id === item.beatId) || {}
              }))
            });
            setPaymentStatus("Completed");
            setShowConfetti(true);
          } else {
            setError("Payment verification failed. Please contact support.");
            setPaymentStatus("Failed");
          }
        } else if (status === "Pending") {
          setPaymentStatus("Pending");
          setError("Your payment is pending. We'll update you once it's completed.");
        } else {
          // Payment failed or was cancelled
          setPaymentStatus("Failed");
          setError("Payment was not completed. Please try again.");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error processing payment:", error);
        setError("Failed to process payment. Please contact support.");
        setPaymentStatus("Error");
        setLoading(false);
      }
    };

    processPayment();

    // Hide confetti after 5 seconds if shown
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Get cart items for display (if needed)
  const [cartItems, setCartItems] = useState([]);
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
  }, []);

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