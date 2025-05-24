// backend/utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT === '465', // true only for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('✅ Email server ready to send messages');
  }
});

/**
 * Send registration OTP
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password for verification
 * @param {string} name - User's name
 * @returns {Promise} - Email sending result
 */
export const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    const mailOptions = {
      from: `"Dhuun Music" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Your Verification Code for Dhuun',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7B2CBF;">Dhuun</h1>
          </div>
          <div style="margin-bottom: 20px;">
            <h2>Verify Your Account</h2>
            <p>Hi ${name},</p>
            <p>Thank you for registering with Dhuun! To complete your registration, please use the following verification code:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 2px; font-weight: bold;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Dhuun. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ OTP email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email after successful registration
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {string} role - User's role
 * @returns {Promise} - Email sending result
 */
export const sendWelcomeEmail = async (email, name = 'User', role = 'buyer') => {
  try {
    const mailOptions = {
      from: `"Dhuun Music" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Welcome to Dhuun Music - Your Beat Marketplace',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7B2CBF;">Welcome to Dhuun!</h1>
          </div>
          <div style="margin-bottom: 20px;">
            <p>Hi ${name},</p>
            <p>Thank you for joining Dhuun - your ultimate platform for buying and selling beats!</p>
            
            <p>Here are a few things you can do on Dhuun:</p>
            <ul style="padding-left: 20px; line-height: 1.5;">
              <li><strong>Explore Beats</strong> - Browse through our collection of high-quality beats</li>
              <li><strong>Follow Producers</strong> - Stay updated with your favorite producers</li>
              <li><strong>Create a Profile</strong> - Complete your profile to showcase your work</li>
              ${role === 'seller' ? '<li><strong>Upload Your Beats</strong> - Start selling your creations to artists worldwide</li>' : ''}
            </ul>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/BeatExplorePage" 
                style="background-color: #7B2CBF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Start Exploring
              </a>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center;">
            <p>© ${new Date().getFullYear()} Dhuun. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Welcome email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send subscription confirmation email
 * @param {Object} subscriptionDetails - Subscription information
 * @returns {Promise} - Email sending result
 */
export const sendSubscriptionConfirmationEmail = async (subscriptionDetails) => {
  try {
    const { 
      userEmail, 
      userName = 'Valued Customer', 
      plan, 
      price, 
      paymentMethod,
      transactionId,
      expiryDate,
      amountPaid 
    } = subscriptionDetails;
    
    const formattedExpiryDate = expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Never';
    const displayPrice = amountPaid || price;

    const planFeatures = {
      Standard: [
        '50 uploads per month',
        '80% revenue share',
        'Priority support'
      ],
      Pro: [
        'Unlimited uploads',
        '95% revenue share',
        'Priority support',
        'Advanced analytics'
      ]
    };

    const mailOptions = {
      from: `"Dhuun Music" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: `Your Dhuun ${plan} Subscription is Active!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7B2CBF;">Dhuun</h1>
          </div>
          <div style="margin-bottom: 20px;">
            <h2>Subscription Confirmed! 🎉</h2>
            <p>Hi ${userName},</p>
            <p>Your <strong>${plan}</strong> subscription has been successfully activated!</p>
            
            <div style="margin: 20px 0; background-color: #f9f9f9; padding: 20px; border-radius: 5px; border-left: 4px solid #7B2CBF;">
              <h3 style="margin-top: 0; color: #7B2CBF;">Subscription Details</h3>
              <p><strong>Plan:</strong> ${plan}</p>
              <p><strong>Amount Paid:</strong> Rs ${displayPrice}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod === 'stripe' ? 'Credit/Debit Card' : 'Khalti'}</p>
              <p><strong>Renewal Date:</strong> ${formattedExpiryDate}</p>
            </div>
            
            <div style="margin: 20px 0;">
              <h3 style="color: #7B2CBF;">Your ${plan} Plan Includes:</h3>
              <ul style="padding-left: 20px; line-height: 1.6;">
                ${planFeatures[plan]?.map(feature => `<li>${feature}</li>`).join('') || '<li>Premium features</li>'}
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                style="background-color: #7B2CBF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Dhuun. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Subscription confirmation email sent to ${userEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email
 * @param {Object} orderDetails - Order information
 * @returns {Promise} - Email sending result
 */
export const sendOrderConfirmation = async (orderDetails) => {
  try {
    const { customerEmail, orderId, items, totalAmount, userName = 'Valued Customer' } = orderDetails;
    
    // Generate items HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
          <strong>${item.beat?.title || 'Beat'}</strong><br>
          <span style="color: #666;">License: ${item.license}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">Rs ${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Dhuun Music" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: `Your Dhuun Order #${orderId} Confirmation`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7B2CBF;">Dhuun</h1>
          </div>
          <div style="margin-bottom: 20px;">
            <h2>Thank You for Your Purchase!</h2>
            <p>Hi ${userName},</p>
            <p>Your order has been confirmed. Below are the details of your purchase:</p>
            
            <div style="margin: 20px 0; background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              
              <h3 style="margin-top: 20px;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f0f0f0;">
                    <th style="padding: 12px; text-align: left;">Item</th>
                    <th style="padding: 12px; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td style="padding: 12px; text-align: right;"><strong>Total</strong></td>
                    <td style="padding: 12px; text-align: right;"><strong>Rs ${totalAmount.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/purchases" 
                style="background-color: #7B2CBF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                View Purchased Beats
              </a>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Dhuun. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Order confirmation email sent to ${customerEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send thank you email after purchase
 * @param {Object} orderDetails - Order information
 * @returns {Promise} - Email sending result
 */
export const sendThankYouEmail = async (orderDetails) => {
  try {
    const { customerEmail, userName = 'Valued Customer', items = [] } = orderDetails;
    
    const beatsCount = items.length;
    const beatNames = items.map(item => item.beat?.title || 'Beat').join(', ');

    const mailOptions = {
      from: `"Dhuun Music" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: 'Thank You for Your Purchase at Dhuun',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7B2CBF;">Dhuun</h1>
          </div>
          <div style="margin-bottom: 20px;">
            <h2>Thank You for Your Purchase!</h2>
            <p>Hi ${userName},</p>
            <p>We just wanted to reach out and thank you for purchasing ${beatsCount > 1 ? 'beats' : 'a beat'} from Dhuun.</p>
            
            <p>We hope you enjoy ${beatsCount > 1 ? 'your beats' : 'your beat'} (${beatNames}) and create something amazing!</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/BeatExplorePage" 
                style="background-color: #7B2CBF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Explore More Beats
              </a>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center;">
            <p>© ${new Date().getFullYear()} Dhuun. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Thank you email sent to ${customerEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending thank you email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send beat purchase notification to producer (when someone buys their beat)
 * @param {Object} saleDetails - Beat sale information
 * @returns {Promise} - Email sending result
 */
export const sendBeatPurchased = async (saleDetails) => {
  try {
    const { 
      producerEmail,
      producerName = 'Producer',
      beatTitle,
      buyerName = 'A customer',
      license,
      salePrice,
      earnings,
      revenueShare,
      orderId,
      saleDate = new Date()
    } = saleDetails;

    const formattedDate = new Date(saleDate).toLocaleDateString();

    const mailOptions = {
      from: `"Dhuun Music" <${process.env.EMAIL_FROM}>`,
      to: producerEmail,
      subject: `🎵 Your beat "${beatTitle}" just sold!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #7B2CBF;">Dhuun</h1>
          </div>
          <div style="margin-bottom: 20px;">
            <h2>Congratulations! 🎉</h2>
            <p>Hi ${producerName},</p>
            <p>Great news! Your beat <strong>"${beatTitle}"</strong> has just been purchased!</p>
            
            <div style="margin: 20px 0; background-color: #f0f8ff; padding: 20px; border-radius: 5px; border-left: 4px solid #1DB954;">
              <h3 style="margin-top: 0; color: #1DB954;">Sale Details</h3>
              <p><strong>Beat:</strong> ${beatTitle}</p>
              <p><strong>Buyer:</strong> ${buyerName}</p>
              <p><strong>License:</strong> ${license}</p>
              <p><strong>Sale Price:</strong> Rs ${salePrice.toFixed(2)}</p>
              <p><strong>Your Earnings:</strong> Rs ${earnings.toFixed(2)} (${revenueShare}% share)</p>
              <p><strong>Order ID:</strong> #${orderId}</p>
              <p><strong>Sale Date:</strong> ${formattedDate}</p>
            </div>
            
            <div style="margin: 20px 0; background-color: #fff7e6; padding: 15px; border-radius: 5px; border-left: 4px solid #FFA500;">
              <p style="margin: 0;"><strong>💰 Earnings Update:</strong> Your earnings have been added to your wallet and are available for withdrawal.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/wallet" 
                style="background-color: #1DB954; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">
                View Wallet
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                style="background-color: transparent; color: #7B2CBF; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; border: 2px solid #7B2CBF;">
                Upload More Beats
              </a>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Dhuun. All rights reserved.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Beat purchase notification sent to ${producerEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending beat purchase notification:', error);
    return { success: false, error: error.message };
  }
};

// Export the transporter for custom email scenarios
export const getTransporter = () => transporter;

export default {
  sendOTPEmail,
  sendWelcomeEmail,
  sendSubscriptionConfirmationEmail,
  sendOrderConfirmation,
  sendThankYouEmail,
  sendBeatPurchased,
  getTransporter
};