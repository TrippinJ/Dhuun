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
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  // Fetch cart items from localStorage or your state management solution
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.cardNumber || 
        !formData.expiryDate || !formData.cvv) {
      setError("Please fill out all fields");
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if user is logged in
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      // Create order
      const orderData = {
        items: cartItems.map(item => ({
          beatId: item._id,
          license: "Basic", // You can make this dynamic based on user selection
          price: item.price
        })),
        totalAmount: total
      };
      
      // Send order to your API
      const response = await API.post("/api/orders", orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear cart after successful purchase
      localStorage.setItem("cart", "[]");
      
      // Navigate to success page
      navigate("/checkout-success", { state: { orderId: response.data.orderId } });
      
    } catch (error) {
      console.error("Checkout error:", error);
      setError("Payment failed. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading checkout...</div>;
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
            
            <form onSubmit={handleSubmit} className={styles.paymentForm}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="johndoe@example.com"
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className={styles.checkoutButton}
                disabled={cartItems.length === 0 || loading}
              >
                {loading ? "Processing..." : `Pay $${total.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;