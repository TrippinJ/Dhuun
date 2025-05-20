import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../css/CheckoutSuccess.module.css";
import { FaDownload, FaArrowRight, FaHome, FaInbox, FaCheck, FaTimes } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import ReviewForm from '../Components/ReviewForm';
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

  // ref to track if payment has been processed
  const hasProcessedPayment = useRef(false);

  // state for managing reviews
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBeatToReview, setSelectedBeatToReview] = useState(null);
  const [reviewedBeats, setReviewedBeats] = useState([]);

  // Handler for the "Write a Review" button
  const handleReviewClick = (beat) => {
    setSelectedBeatToReview(beat);
    setShowReviewForm(true);

    // Scroll to the review form
    setTimeout(() => {
      window.scrollTo({
        top: document.getElementById('review-section').offsetTop,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Handler for when a review is submitted
  const handleReviewSubmitted = (review) => {
    // Add the beat ID to the list of reviewed beats
    setReviewedBeats([...reviewedBeats, review.beat]);

    // Hide the form after a short delay
    setTimeout(() => {
      setShowReviewForm(false);
      setSelectedBeatToReview(null);
    }, 3000);
  };

  // Add this before your return statement in the component
  const isAlreadyReviewed = (beatId) => {
    return reviewedBeats.includes(beatId);
  };

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
  }, []);

  // Helper functions for processing different payment methods
  const processKhaltiPayment = async (pidx, token, pendingOrderData) => {
    try {
      const storedPidx = localStorage.getItem("pidx");
      if (pidx !== storedPidx) {
        setError("Invalid payment session. Please try again.");
        return;
      }

      // Step 1: Verify payment with backend
      const verifyResponse = await API.post(
        "/api/orders/verify-payment",
        { pidx: pidx },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Khalti payment verification response:", verifyResponse.data);

      if (verifyResponse.data.success) {
        // Step 2: Create order if payment verification was successful
        const orderData = {
          items: pendingOrderData.items,
          totalAmount: pendingOrderData.totalAmount,
          paymentMethod: "khalti",
          paymentId: verifyResponse.data.transaction_id,
          paymentPidx: pidx
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
    } catch (error) {
      console.error("Error processing Khalti payment:", error);
      throw error;
    }
  };

  // Add Stripe payment processing
  const processStripePayment = async (sessionId, token, pendingOrderData) => {
    try {
      // Verify Stripe session
      const verifyResponse = await API.post(
        "/api/payments/verify-stripe-session",
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Stripe session verification response:", verifyResponse.data);

      if (verifyResponse.data.success && verifyResponse.data.status === 'paid') {
        // Create order
        const orderData = {
          items: pendingOrderData.items,
          totalAmount: pendingOrderData.totalAmount,
          paymentMethod: "stripe",
          paymentId: sessionId
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
          localStorage.removeItem("stripeSessionId");
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
    } catch (error) {
      console.error("Error processing Stripe payment:", error);
      throw error;
    }
  };

  useEffect(() => {
    const processPayment = async () => {
      // Add guard to prevent duplicate processing
      if (hasProcessedPayment.current) {
        console.log("Payment already processed, skipping...");
        return;
      }

      try {
        // Get URL parameters from Khalti redirect
        const params = new URLSearchParams(window.location.search);
        const returnedPidx = params.get("pidx");
        const status = params.get("status");

        // Check for Stripe return (look for session_id)
        const stripeSessionId = localStorage.getItem("stripeSessionId");

        // Only proceed if we have a payment identifier
        if (!returnedPidx && !stripeSessionId) {
          setLoading(false);
          return;
        }

        // Set flag to prevent duplicate processing
        hasProcessedPayment.current = true;

        setVerifyingPayment(true);
        setLoading(true);

        // Get stored values from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const pendingOrderData = JSON.parse(localStorage.getItem("pendingOrder") || "null");
        if (!pendingOrderData) {
          setError("Order information not found. Please try again.");
          setVerifyingPayment(false);
          setLoading(false);
          return;
        }

        // Process based on payment method
        if (returnedPidx) {
          // Khalti payment processing
          await processKhaltiPayment(returnedPidx, token, pendingOrderData);
        } else if (stripeSessionId) {
          // Stripe payment processing
          await processStripePayment(stripeSessionId, token, pendingOrderData);
        }

        // Clean up URL parameters
        window.history.replaceState({}, document.title, "/checkout-success");
      } catch (error) {
        console.error("Error processing payment:", error);
        setError("Failed to process payment. Please contact support.");
        setPaymentStatus("Error");
      } finally {
        setVerifyingPayment(false);
        setLoading(false);
      }
    };

    // Execute payment processing
    processPayment();
  }, [location]); // Remove showConfetti from dependencies

  // Separate effect for confetti cleanup
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Rest of your component remains the same...
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

                      {paymentStatus === "Completed" && (
                        <button
                          className={styles.reviewButton}
                          onClick={() => handleReviewClick(item)}
                          disabled={isAlreadyReviewed(item._id) || showReviewForm}
                        >
                          {isAlreadyReviewed(item._id) ? 'Reviewed' : 'Write a Review'}
                        </button>
                      )}

                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalAmount}>
                <span>Total:</span>
                <span>
                  Rs {cartItems.reduce((sum, item) =>
                    sum + (item.licensePrice || item.price), 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}


          {/* Review Section */}
          {paymentStatus === "Completed" && (
            <div id="review-section" className={styles.reviewSection}>
              {showReviewForm && selectedBeatToReview && orderDetails && (
                <ReviewForm
                  beat={selectedBeatToReview}
                  orderId={orderDetails.orderId || orderDetails._id}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              )}
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