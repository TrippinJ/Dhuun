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

  // Fetch cart items from localStorage
  useEffect(() => {
    try {
      // Get cart from localStorage
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(cart);
      
      // Calculate total
      const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
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

  const handleKhaltiPayment = () => {
    
    // Basic validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    try {
      setPaymentProcessing(true);
      
      // Check if user is logged in
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      // Load Khalti script dynamically
      const script = document.createElement('script');
      script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.22.0.0.0/khalti-checkout.iffe.js';
      script.async = true;
      
      script.onload = () => {
        // Once Khalti is loaded, initialize payment
        const khaltiKey = process.env.KHALTI_PUBLIC_KEY || 'Not Set'; 
        const priceInPaisa = total * 100; // Khalti expects amount in paisa (1 NPR = 100 paisa)
        
        const config = {
          publicKey: khaltiKey,
          productIdentity: "beatOrder" + Date.now(),
          productName: "Beats Purchase",
          productUrl: window.location.href,
          eventHandler: {
            onSuccess: async (payload) => {
              try {
                // Create order with payment info
                const orderData = {
                  items: cartItems.map(item => ({
                    beatId: item._id,
                    license: "Basic", // You can make this dynamic based on user selection
                    price: item.price
                  })),
                  totalAmount: total,
                  customerEmail: email,
                  paymentMethod: "khalti",
                  paymentId: payload.token
                };
                
                // Send order to your API
                const response = await API.post("/api/orders", orderData, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                // Clear cart after successful purchase
                localStorage.setItem("cart", "[]");
                
                // Navigate to success page
                navigate("/checkout-success", { 
                  state: { 
                    orderId: response.data.orderId || response.data._id 
                  } 
                });
              } catch (err) {
                console.error("Payment verification error:", err);
                setError("Payment verification failed. Please contact support.");
                setPaymentProcessing(false);
              }
            },
            onError: (error) => {
              console.error("Khalti payment error:", error);
              setError("Payment failed. Please try again later.");
              setPaymentProcessing(false);
            },
            onClose: () => {
              console.log("Khalti payment widget closed");
              setPaymentProcessing(false);
            }
          },
          amount: priceInPaisa
        };
        
        const checkout = new window.KhaltiCheckout(config);
        checkout.show({ amount: priceInPaisa });
      };
      
      document.body.appendChild(script);
      
    } catch (error) {
      console.error("Checkout error:", error);
      setError("Payment failed. Please try again.");
      setPaymentProcessing(false);
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
        
        <div className={styles.checkoutGrid}>
          {/* Order Summary Section */}
          <div className={styles.orderSummary}>
            <h2>Order Summary</h2>
            
            <div className={styles.cartItems}>
              {cartItems.length === 0 ? (
                <p>Your cart is empty</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item._id} className={styles.cartItem}>
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
                      <p className={styles.itemLicense}>Basic License</p>
                    </div>
                    <div className={styles.itemPrice}>${item.price}</div>
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
              
              {/* <div className={styles.paymentOptions}>
                <div className={styles.paymentMethod}>
                  <img 
                    src="/khalti-logo.png" 
                    alt="Khalti" 
                    className={styles.khaltiLogo}
                    onError={(e) => e.target.src = "https://khalti.com/static/images/khalti-logo.svg"} 
                  />
                  <span>Pay with Khalti</span>
                </div>
              </div> */}
              
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