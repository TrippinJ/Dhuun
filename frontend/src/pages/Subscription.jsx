import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import styles from '../css/Subscription.module.css';
import { FaCheck, FaTimes, FaArrowLeft, FaCrown } from 'react-icons/fa';
import NavbarBeatExplore from '../Components/NavbarBeatExplore';

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Handle Khalti payment initiation
  const handleKhaltiPayment = async (plan, price) => {
    if (!plan || !price) {
      setError("Invalid subscription plan");
      return;
    }
  
    try {
      setProcessingPayment(true);
      setError(null);
  
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to purchase a subscription");
        navigate("/login");
        return;
      }
  
      // Store plan information in localStorage
      localStorage.setItem("selectedPlan", plan);
      localStorage.setItem("planPrice", price.toString());
      
      // Prepare the items for payment
      const items = [
        {
          type: "subscription",
          name: `${plan} Subscription`,
          price: price
        }
      ];
  
      // Initiate payment through backend
      const response = await API.post(
        "/api/payments/initiate",
        {
          amount: price,
          items,
          customerEmail: "", // Backend will use user's email
          returnUrl: window.location.origin + "/subscription"  // Explicitly set return URL
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      if (response.data && response.data.payment_url && response.data.pidx) {
        // Save payment ID for verification when returning
        localStorage.setItem("pidx", response.data.pidx);
  
        // Redirect to Khalti payment page
        window.location.href = response.data.payment_url;
      } else {
        setError("Failed to initiate payment. Please try again.");
      }
    } catch (error) {
      console.error("Khalti payment error:", error);
      setError(
        error.response?.data?.message ||
          "Payment failed. Please try again later."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle payment verification when returning from Khalti
  useEffect(() => {
    const handlePaymentReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const returnedPidx = params.get("pidx");
      const txnId = params.get("txnId") || params.get("transaction_id");
      const status = params.get("status");

      // Only proceed if we have a pidx in the URL (returned from Khalti)
      if (!returnedPidx) {
        return;
      }

      try {
        setVerifyingPayment(true);
        setLoading(true);
        
        // Get stored values from localStorage
        const storedPidx = localStorage.getItem("pidx");
        const selectedPlan = localStorage.getItem("selectedPlan");
        
        console.log("Payment return detected:", { 
          returnedPidx, 
          txnId, 
          status, 
          storedPidx, 
          selectedPlan 
        });
        
        // Basic validation
        if (returnedPidx !== storedPidx) {
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

        // Verify payment with backend
        const verifyResponse = await API.post(
          "/api/payments/verify",
          { pidx: returnedPidx },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Payment verification response:", verifyResponse.data);

        if (verifyResponse.data.success || verifyResponse.data.status === "Completed") {
          // Payment was successful, update subscription
          const updateResponse = await API.post(
            "/api/subscription/update",
            { plan: selectedPlan },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setSubscription(updateResponse.data.subscription);
          setSuccessMessage(`${selectedPlan} plan activated successfully!`);
          
          // Clean up localStorage
          localStorage.removeItem("selectedPlan");
          localStorage.removeItem("pidx");
          localStorage.removeItem("planPrice");
        } else {
          // Payment verification failed
          setError("Payment verification failed. Please try again or contact support.");
        }

        // Clean up URL parameters
        window.history.replaceState({}, document.title, "/subscription");
      } catch (error) {
        console.error("Error processing payment return:", error);
        setError("Failed to process payment. Please contact support.");
      } finally {
        setVerifyingPayment(false);
        setLoading(false);
      }
    };

    // Execute payment return handler
    handlePaymentReturn();
  }, [navigate]);

  // Fetch current subscription data
  const fetchSubscription = useCallback(async () => {
    if (verifyingPayment) {
      return; // Don't fetch if we're currently verifying a payment
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to view subscription details");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const response = await API.get("/api/subscription", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Subscription data:", response.data);
      setSubscription(response.data.subscription);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching subscription:", err);

      if (err.response && err.response.status === 401) {
        setError("Authentication required. Please log in again.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to load subscription details. Please try again later.");
      }

      setLoading(false);
    }
  }, [navigate, verifyingPayment]);

  // Fetch subscription on component mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Handle plan selection
  const handleSelectPlan = async (plan, price) => {
    try {
      setError(null);
      setSuccessMessage("");
  
      // If selecting the same plan as current
      if (subscription && subscription.plan === plan) {
        setSuccessMessage("You are already on this plan.");
        setTimeout(() => setSuccessMessage(""), 3000);
        return;
      }
  
      // For free plan, update directly
      if (plan === "Free") {
        const token = localStorage.getItem("token");
        const res = await API.post(
          "/api/subscription/update",
          { plan },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
  
        setSubscription(res.data.subscription);
        setSuccessMessage("Free plan activated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        return;
      }
  
      // For paid plans, redirect to Khalti payment flow
      await handleKhaltiPayment(plan, price);
  
    } catch (err) {
      console.error("Error selecting plan:", err);
      setError("Failed to select plan. Please try again later.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Subscription plans data
  const plans = [
    {
      name: "Free",
      price: 0,
      uploadLimit: 10,
      revenueShare: 60,
      features: [
        "Basic features",
        "Limited uploads",
        "60% revenue share",
        "No expiry date"
      ]
    },
    {
      name: "Standard",
      price: 9.99,
      uploadLimit: 50,
      revenueShare: 80,
      features: [
        "All Free features",
        "50 uploads per month",
        "80% revenue share",
        "30-day subscription"
      ]
    },
    {
      name: "Pro",
      price: 24.99,
      uploadLimit: "Unlimited",
      revenueShare: 95,
      features: [
        "All Standard features",
        "Unlimited uploads",
        "95% revenue share",
        "Priority support",
        "30-day subscription"
      ]
    }
  ];

  if (loading) {
    return (
      <>
        <NavbarBeatExplore />
        <div className={styles.subscriptionContainer}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>{verifyingPayment ? "Processing your payment..." : "Loading subscription details..."}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavbarBeatExplore />
      <div className={styles.subscriptionContainer}>
        <div className={styles.header}>
          <button 
            className={styles.backButton} 
            onClick={() => navigate("/dashboard")}
          >
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Choose Your Subscription Plan</h1>
          <p className={styles.headerSubtext}>
            Upgrade your plan to unlock more features and increase your earning potential
          </p>
        </div>

        {error && (
          <div className={styles.alert}>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className={styles.alert}>
            <p className={styles.successMessage}>{successMessage}</p>
          </div>
        )}

        {subscription && (
          <div className={styles.currentSubscription}>
            <div className={styles.currentSubscriptionHeader}>
              <h2>Current Subscription</h2>
              <div className={styles.activeStatus}>
                <span className={styles.statusDot}></span>
                Active
              </div>
            </div>
            <div className={styles.subscriptionDetails}>
              <div className={styles.detail}>
                <span className={styles.label}>Plan:</span>
                <span className={styles.value}>{subscription.plan}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Status:</span>
                <span className={styles.value}>{subscription.status}</span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Upload Limit:</span>
                <span className={styles.value}>
                  {subscription.uploadLimit === Infinity || subscription.uploadLimit === "Unlimited" 
                    ? "Unlimited" 
                    : subscription.uploadLimit}
                </span>
              </div>
              <div className={styles.detail}>
                <span className={styles.label}>Revenue Share:</span>
                <span className={styles.value}>{subscription.revenueShare}%</span>
              </div>
              {subscription.expiryDate && (
                <div className={styles.detail}>
                  <span className={styles.label}>Expires:</span>
                  <span className={styles.value}>
                    {new Date(subscription.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={styles.plansContainer}>
          {plans.map((plan) => (
            <div
              className={`${styles.planCard} ${subscription && subscription.plan === plan.name ? styles.current : ""}`}
              key={plan.name}
            >
              {subscription && subscription.plan === plan.name && (
                <div className={styles.currentPlanBadge}>Current Plan</div>
              )}
              <div className={styles.planHeader}>
                <div className={styles.planIcon}>
                  <FaCrown />
                </div>
                <h3>{plan.name}</h3>
                <div className={styles.price}>
                  Rs {plan.price}
                  <span>/mo</span>
                </div>
              </div>
              <button
                  className={`${styles.secondaryPlanButton} ${plan.name === "Pro" ? styles.proPlanButton : ""}`}
                  onClick={() => handleSelectPlan(plan.name, plan.price)}
                  disabled={processingPayment || (subscription && subscription.plan === plan.name)}
                >
                  {processingPayment
                    ? "Processing..."
                    : subscription && subscription.plan === plan.name
                    ? "Current Plan"
                    : plan.price === 0
                    ? "Choose Plan"
                    : `Subscribe Rs ${plan.price}/mo`}
                </button>
              <div className={styles.planFeatures}>
                <ul>
                  <li>
                    <FaCheck className={styles.checkIcon} />
                    <strong>Upload Limit:</strong> {plan.uploadLimit}
                  </li>
                  <li>
                    <FaCheck className={styles.checkIcon} />
                    <strong>Revenue Share:</strong> {plan.revenueShare}%
                  </li>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <FaCheck className={styles.checkIcon} /> {feature}
                    </li>
                  ))}
                </ul>
                
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className={styles.faqSection}>
          <h2>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3>How do I change my subscription?</h3>
              <p>
                You can change your subscription at any time by selecting a new plan above. If upgrading, you'll be charged the full amount of the new plan. If downgrading, your current plan will continue until its expiration date.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>When will I be charged?</h3>
              <p>
                Paid subscriptions are charged immediately upon signup. Subscriptions automatically renew every 30 days until canceled.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>How do I cancel my subscription?</h3>
              <p>
                You can cancel anytime by downgrading to the Free plan. Your paid features will remain active until the end of your current billing period.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h3>What payment methods are accepted?</h3>
              <p>
                We currently accept payments through Khalti. More payment options will be available soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Subscription;