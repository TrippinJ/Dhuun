import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/Checkout.module.css";
import { FaArrowLeft, FaLock } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [email, setEmail] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingState, setProcessingState] = useState('idle'); // idle, loading, success, error

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

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  // New method that uses the backend to initiate payment
  const handleKhaltiPayment = async () => {
    // Basic validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

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

      // Initiate payment through our backend API
      const response = await API.post("/api/payments/initiate", {
        amount: total,
        items: itemsData,
        customerEmail: email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Payment initiation response:", response.data);

      if (response.data.success && response.data.payment_url) {
        // Store order data in localStorage to retrieve after payment
        localStorage.setItem("pendingOrder", JSON.stringify({
          items: itemsData,
          totalAmount: total,
          customerEmail: email,
          pidx: response.data.pidx
        }));

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

          {/* Payment Form Section */}
          <div className={styles.paymentSection}>
            <h2>Payment Information</h2>
            <div className={styles.securePayment}>
              <FaLock /> Secure Checkout
            </div>

            <div className={styles.paymentForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email (for order confirmation)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleKhaltiPayment}
                className={styles.khaltiButton}
                disabled={cartItems.length === 0 || paymentProcessing}
              >
                {paymentProcessing ? "Processing..." : `Pay $${total.toFixed(2)} with Khalti`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;