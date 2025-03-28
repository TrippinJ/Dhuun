// frontend/src/components/Subscription.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/Subscription.css'; 

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Move fetchSubscription before useEffect and wrap it in useCallback
  const fetchSubscription = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.get('/api/subscription', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSubscription(res.data.subscription);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      
      if (err.response && err.response.status === 401) {
        setError('You must be logged in to view subscription details');
        // Redirect to login page after a delay
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Failed to load subscription details. Please try again later.');
      }
      
      setLoading(false);
    }
  }, [navigate]); // Include navigate as a dependency since it's used in the function

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view subscription details');
      setLoading(false);
      // Redirect to login page after a delay
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    fetchSubscription();
  }, [navigate, fetchSubscription]); // Now fetchSubscription is properly included

  const handleSelectPlan = async (plan, price) => {
    try {
      // For free plan, directly update subscription
      if (plan === 'Free') {
        const token = localStorage.getItem('token');
        
        const res = await axios.post(
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
      
      // Load Khalti script dynamically
      const script = document.createElement('script');
      script.src = 'https://khalti.s3.ap-south-1.amazonaws.com/KPG/dist/2020.12.22.0.0.0/khalti-checkout.iffe.js';
      script.async = true;
      
      script.onload = () => {
        // Once Khalti is loaded, initialize payment
        const khaltiKey = process.env.KHALTI_PUBLIC_KEY || '93148c2f7d274399afd73aab9e9ad7f4';
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
                const res = await axios.post(
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
        document.body.removeChild(script);
      };
    } catch (err) {
      console.error('Error selecting plan:', err);
      setError('Failed to select plan. Please try again later.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="subscription-container loading">
        <div className="spinner"></div>
        <p>Loading subscription details...</p>
      </div>
    );
  }

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

  return (
    <div className="subscription-container">
      <h1>Choose Your Subscription Plan</h1>
      
      {error && (
        <div className="alert error">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="alert success">
          <p>{successMessage}</p>
        </div>
      )}
      
      {subscription && (
        <div className="current-subscription">
          <h2>Current Subscription</h2>
          <div className="subscription-details">
            <div className="detail">
              <span className="label">Plan:</span>
              <span className="value">{subscription.plan}</span>
            </div>
            <div className="detail">
              <span className="label">Status:</span>
              <span className="value">{subscription.status}</span>
            </div>
            <div className="detail">
              <span className="label">Upload Limit:</span>
              <span className="value">
                {subscription.uploadLimit === Infinity ? 'Unlimited' : subscription.uploadLimit}
              </span>
            </div>
            <div className="detail">
              <span className="label">Revenue Share:</span>
              <span className="value">{subscription.revenueShare}%</span>
            </div>
            {subscription.expiryDate && (
              <div className="detail">
                <span className="label">Expires:</span>
                <span className="value">
                  {new Date(subscription.expiryDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="plans-container">
        {plans.map((plan) => (
          <div className={`plan-card ${subscription && subscription.plan === plan.name ? 'current' : ''}`} key={plan.name}>
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="price">${plan.price}<span>/mo</span></div>
            </div>
            <div className="plan-features">
              <ul>
                <li>
                  <strong>Upload Limit:</strong> {plan.uploadLimit}
                </li>
                <li>
                  <strong>Revenue Share:</strong> {plan.revenueShare}%
                </li>
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            <button 
              className="plan-button"
              onClick={() => handleSelectPlan(plan.name, plan.price)}
              disabled={subscription && subscription.plan === plan.name}
            >
              {subscription && subscription.plan === plan.name 
                ? 'Current Plan' 
                : `Pay with Khalti`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;