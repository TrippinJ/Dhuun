// In frontend/src/pages/Checkout.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/Checkout.module.css";
import { FaArrowLeft, FaLock, FaCreditCard, FaGlobe } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingState, setProcessingState] = useState('idle'); // idle, loading, success, error
  const [paymentMethod, setPaymentMethod] = useState('khalti'); // 'khalti' or 'stripe'

  // Fetch cart items from localStorage
  useEffect(() => {
    try {
      // Get cart from localStorage
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(cart);

      // Calculate total
      const cartTotal = cart.reduce((sum, item) => sum + (item.licensePrice || item.price), 0);
      setTotal(cartTotal);

      setLoading(false);
    } catch (error) {
      console.error("Error loading cart:", error);
      setError("Failed to load your cart. Please try again.");
      setLoading(false);
    }
  }, []);

  // Handle Khalti payment
  const handleKhaltiPayment = async () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    try {
      setPaymentProcessing(true);
      setProcessingState('loading');
      setError(null);

      // Check if user is logged in
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Prepare the items data
      const itemsData = cartItems.map(item => ({
        beatId: item._id,
        license: item.selectedLicense || "Basic",
        licenseName: item.licenseName || "Basic License",
        price: item.licensePrice || item.price
      }));

      // Store cart info in localStorage for later retrieval
      localStorage.setItem("pendingOrder", JSON.stringify({
        items: itemsData,
        totalAmount: total,
        timestamp: Date.now()
      }));

      // Initiate payment through backend API
      const response = await API.post("/api/payments/initiate", {
        amount: total,
        items: itemsData,
        returnUrl: window.location.origin + "/checkout-success"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Payment initiation response:", response.data);

      if (response.data.success && response.data.payment_url) {
        // Store payment ID for verification
        localStorage.setItem("pidx", response.data.pidx);

        // Redirect to Khalti payment page
        window.location.href = response.data.payment_url;
      } else {
        setError("Failed to initialize payment. Please try again.");
        setPaymentProcessing(false);
        setProcessingState('error');
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error.response?.data?.message || "Payment failed. Please try again.");
      setPaymentProcessing(false);
      setProcessingState('error');
    }
  };

  // Handle Stripe payment
  const handleStripePayment = async () => {
    if (cartItems.length === 0) {
      setError("Your cart is empty");
      return;
    }

    try {
      setPaymentProcessing(true);
      setProcessingState('loading');
      setError(null);

      // Check if user is logged in
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Prepare the items data
      const itemsData = cartItems.map(item => ({
        beatId: item._id,
        license: item.selectedLicense || "Basic",
        licenseName: item.licenseName || "Basic License",
        price: item.licensePrice || item.price
      }));

      // Store cart info for later use
      localStorage.setItem("pendingOrder", JSON.stringify({
        items: itemsData,
        totalAmount: total,
        timestamp: Date.now()
      }));

      // Initiate Stripe payment session
      const response = await API.post("/api/payments/create-stripe-session", {
        amount: total,
        items: itemsData,
        successUrl: window.location.origin + "/checkout-success",
        cancelUrl: window.location.origin + "/cart"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Stripe session response:", response.data);

      if (response.data.success && response.data.sessionUrl) {
        // Store session ID for verification
        localStorage.setItem("stripeSessionId", response.data.sessionId);

        // Redirect to Stripe checkout
        window.location.href = response.data.sessionUrl;
      } else {
        setError("Failed to initialize payment. Please try again.");
        setPaymentProcessing(false);
        setProcessingState('error');
      }
    } catch (error) {
      console.error("Stripe checkout error:", error);
      setError(error.response?.data?.message || "Payment failed. Please try again.");
      setPaymentProcessing(false);
      setProcessingState('error');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading checkout...</div>;
  }

  return (
    <div className={styles.checkoutContainer}>
      <NavbarBeatExplore />

      <div className={styles.checkoutContent}>
        <div className={styles.checkoutHeader}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/cart")}
          >
            <FaArrowLeft /> Back to Cart
          </button>
          <h1>Checkout</h1>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {processingState === 'loading' && (
          <div className={styles.processingMessage}>
            <div className={styles.loadingSpinner}></div>
            <p>Processing your payment. Please wait...</p>
          </div>
        )}

        <div className={styles.checkoutGrid}>
          {/* Order Summary Section */}
          <div className={styles.orderSummary}>
            <h2>Order Summary</h2>

            <div className={styles.cartItems}>
              {cartItems.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id + (item.selectedLicense || 'basic')} className={styles.cartItem}>
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemDetails}>
                      <h3>{item.title}</h3>
                      <p className={styles.itemProducer}>
                        {item.producer?.name || "Unknown Producer"}
                      </p>
                      <p className={styles.itemLicense}>
                        {item.licenseName || item.selectedLicense || 'Basic License'}
                      </p>
                    </div>
                    <div className={styles.itemPrice}>
                      ${(item.licensePrice || item.price).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.orderTotal}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>Tax</span>
                <span>$0.00</span>
              </div>
              <div className={`${styles.totalRow} ${styles.finalTotal}`}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Selection Section */}
          <div className={styles.paymentSection}>
            <h2>Payment Information</h2>
            <div className={styles.securePayment}>
              <FaLock /> Secure Checkout
            </div>

            <div className={styles.paymentOptions}>
              <h3>Select Payment Method</h3>
              
              <div className={styles.paymentMethods}>
                <div 
                  className={`${styles.paymentMethod} ${paymentMethod === 'khalti' ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod('khalti')}
                >
                  <div className={styles.methodIcon}>🇳🇵</div>
                  <div className={styles.methodInfo}>
                    <h4>Khalti</h4>
                    <p>Pay using Khalti digital wallet (Nepal)</p>
                  </div>
                </div>
                
                <div 
                  className={`${styles.paymentMethod} ${paymentMethod === 'stripe' ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod('stripe')}
                >
                  <div className={styles.methodIcon}><FaGlobe /></div>
                  <div className={styles.methodInfo}>
                    <h4>Stripe</h4>
                    <p>Pay with Credit/Debit card (International)</p>
                  </div>
                </div>
              </div>

              {paymentMethod === 'khalti' ? (
                <button
                  type="button"
                  onClick={handleKhaltiPayment}
                  className={styles.khaltiButton}
                  disabled={cartItems.length === 0 || paymentProcessing}
                >
                  {paymentProcessing ? "Processing..." : `Pay $${total.toFixed(2)} with Khalti`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStripePayment}
                  className={styles.stripeButton}
                  disabled={cartItems.length === 0 || paymentProcessing}
                >
                  {paymentProcessing ? "Processing..." : `Pay $${total.toFixed(2)} with Card`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;