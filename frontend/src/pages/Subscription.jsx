import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import styles from '../css/Subscription.module.css';
import { FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleKhaltiPayment = async (plan, price) => {
    try {
      setProcessingPayment(true);
      setError(null);
      
      // Get authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to purchase a subscription");
        setProcessingPayment(false);
        return;
      }
      
      // Prepare the payment data
      const paymentData = {
        amount: price,
        items: [{
          type: 'subscription',
          name: `${plan} Subscription`,
          price: price
        }],
        // This will be the URL to return to after payment
        returnUrl: `${window.location.origin}/subscription?success=true&plan=${plan}`
      };
      
      // Call your payment API endpoint
      const response = await API.post('/api/payments/initiate', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.payment_url) {
        // Store selected plan in localStorage to retrieve after payment
        localStorage.setItem('selectedPlan', plan);
        
        // Redirect to Khalti payment page
        window.location.href = response.data.payment_url;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError('Failed to initiate payment. Please try again.');
      setProcessingPayment(false);
    }
  };
  
  // 3. Add this effect to handle the return from Khalti
  // This should be added to your existing useEffect hooks in the component
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const plan = params.get('plan');
    
    if (success === 'true' && plan) {
      // Update subscription with the selected plan
      const updateSubscription = async () => {
        try {
          const token = localStorage.getItem('token');
          
          const res = await API.post(
            '/api/subscription/update',
            { plan },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          setSubscription(res.data.subscription);
          setSuccessMessage(`${plan} plan activated successfully!`);
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, "/subscription");
          
          // Remove stored plan
          localStorage.removeItem('selectedPlan');
        } catch (error) {
          console.error('Error updating subscription after payment:', error);
          setError('Failed to activate your subscription. Please contact support.');
        }
      };
      
      updateSubscription();
    }
  }, []);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to view subscription details');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await API.get('/api/subscription', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSubscription(response.data.subscription);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      
      if (err.response && err.response.status === 401) {
        setError('You must be logged in to view subscription details');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to load subscription details. Please try again later.');
      }
      
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Handle plan selection
  const handleSelectPlan = async (plan, price) => {
    try {
      setError(null);
      
      // For free plan, directly update subscription
      if (plan === 'Free') {
        const token = localStorage.getItem('token');
        
        const res = await API.post(
          '/api/subscription/update',
          { plan },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setSubscription(res.data.subscription);
        setSuccessMessage('Free plan activated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        return;
      }
      
      // For paid plans, initialize Khalti payment
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to purchase a subscription');
        return;
      }
      
    
      script.onload = () => {
        // Once Khalti is loaded, initialize payment
        const khaltiKey = process.env.REACT_APP_KHALTI_PUBLIC_KEY || '994dad9a767e4b57a455035549d3d6b1';
        const priceInPaisa = price * 100; // Khalti expects amount in paisa (1 NPR = 100 paisa)
        
        const config = {
          publicKey: khaltiKey,
          productIdentity: plan,
          productName: `${plan} Subscription`,
          productUrl: window.location.href,
          eventHandler: {
            onSuccess: async (payload) => {
              try {
                // Verify payment and update subscription
                const res = await API.post(
                  '/api/subscription/verify-payment',
                  {
                    token: payload.token,
                    amount: payload.amount,
                    plan
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }
                );
                
                setSubscription(res.data.subscription);
                setSuccessMessage('Payment successful and subscription updated!');
                setTimeout(() => setSuccessMessage(''), 3000);
              } catch (err) {
                console.error('Payment verification error:', err);
                setError('Payment verification failed. Please contact support.');
                setTimeout(() => setError(''), 5000);
              }
            },
            onError: (error) => {
              console.error('Khalti payment error:', error);
              setError('Payment failed. Please try again later.');
              setTimeout(() => setError(''), 3000);
            },
            onClose: () => {
              console.log('Khalti payment widget closed');
            }
          },
          amount: priceInPaisa
        };
        
        const checkout = new window.KhaltiCheckout(config);
        checkout.show({ amount: priceInPaisa });
      };
      
      document.body.appendChild(script);
      
      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Failed to select plan. Please try again later.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Subscription plans data
  const plans = [
    {
      name: 'Free',
      price: 0,
      uploadLimit: 5,
      revenueShare: 60,
      features: [
        'Basic features',
        'Limited uploads',
        '60% revenue share',
        'No expiry date'
      ]
    },
    {
      name: 'Standard',
      price: 9.99,
      uploadLimit: 50,
      revenueShare: 80,
      features: [
        'All Free features',
        '50 uploads per month',
        '80% revenue share',
        '30-day subscription'
      ]
    },
    {
      name: 'Pro',
      price: 24.99,
      uploadLimit: 'Unlimited',
      revenueShare: 95,
      features: [
        'All Standard features',
        'Unlimited uploads',
        '95% revenue share',
        'Priority support',
        '30-day subscription'
      ]
    }
  ];

  if (loading) {
    return (
      <div className={styles.subscriptionContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.subscriptionContainer}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/dashboard')}>
            <FaArrowLeft /> Back to Dashboard
          </button>
          <h1>Choose Your Subscription Plan</h1>
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
            <h2>Current Subscription</h2>
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
                  {subscription.uploadLimit === Infinity ? 'Unlimited' : subscription.uploadLimit}
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
              className={`${styles.planCard} ${subscription && subscription.plan === plan.name ? styles.current : ''}`} 
              key={plan.name}
            >
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <div className={styles.price}>
                  ${plan.price}
                  <span>/mo</span>
                </div>
              </div>
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
              <button 
                className={`${styles.planButton} ${plan.name === 'Pro' ? styles.proPlanButton : ''}`}
                onClick={() => handleSelectPlan(plan.name, plan.price)}
                disabled={subscription && subscription.plan === plan.name}
              >
                {subscription && subscription.plan === plan.name 
                  ? 'Current Plan' 
                  : plan.price === 0 ? 'Choose Plan' : `Pay with Khalti`}
              </button>
            </div>
          ))}
        </div>
      </div>
  );
};

export default Subscription;