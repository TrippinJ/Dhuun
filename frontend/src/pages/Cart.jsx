import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/Cart.module.css";
import { FaTrash, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Load cart items from localStorage
    const loadCart = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartItems(cart);

        // Calculate total with license prices
        const cartTotal = cart.reduce((sum, item) => 
          sum + (item.licensePrice || item.price), 0
        );
        setTotal(cartTotal);
      } catch (error) {
        console.error("Error loading cart:", error);
        setCartItems([]);
        setTotal(0);
      }
    };

    loadCart();
  }, []);

  // Add the missing handleContinueShopping function
  const handleContinueShopping = () => {
    navigate("/BeatExplorePage");
  };

  // Add the missing handleCheckout function
  const handleCheckout = () => {
    // Only proceed to checkout if cart has items
    if (cartItems.length > 0) {
      navigate("/checkout");
    }
  };

  const handleRemoveItem = (uniqueId) => {
    const updatedCart = cartItems.filter(item => 
      (item._id + (item.selectedLicense || 'basic')) !== uniqueId
    );
    setCartItems(updatedCart);
    
    // Update total
    const newTotal = updatedCart.reduce((sum, item) => 
      sum + (item.licensePrice || item.price), 0
    );
    setTotal(newTotal);
    
    // Update localStorage
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  return (
    <div className={styles.cartContainer}>
      <NavbarBeatExplore />

      <div className={styles.cartContent}>
        <div className={styles.cartHeader}>
          <h1>Your Cart</h1>
          <span className={styles.itemCount}>{cartItems.length} item(s)</span>
        </div>

        {cartItems.length === 0 ? (
          <div className={styles.emptyCart}>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any beats to your cart yet.</p>
            <button
              className={styles.shopButton}
              onClick={handleContinueShopping}
            >
              Explore Beats
            </button>
          </div>
        ) : (
          <div className={styles.cartGrid}>
            <div className={styles.cartItems}>
              {cartItems.map((item) => (
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
                    Rs {(item.licensePrice || item.price).toFixed(2)}
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveItem(item._id + (item.selectedLicense || 'basic'))}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.cartSummary}>
              <h2>Order Summary</h2>

              <div className={styles.summaryDetails}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Tax</span>
                  <span>Rs 0.00</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Total</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.cartActions}>
                <button
                  className={styles.continueButton}
                  onClick={handleContinueShopping}
                >
                  <FaArrowLeft /> Continue Shopping
                </button>
                <button
                  className={styles.checkoutButton}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;