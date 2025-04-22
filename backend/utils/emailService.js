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
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${item.price.toFixed(2)}</td>
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
                    <td style="padding: 12px; text-align: right;"><strong>$${totalAmount.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style="margin-top: 20px;">
              <p>You can download your beats by visiting your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="color: #7B2CBF; text-decoration: none;">Purchased Beats</a> section in your dashboard.</p>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
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
 * Send thank you email after purchase (separate from order confirmation)
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
            
            <p>We hope you enjoy ${beatsCount > 1 ? 'your beats' : 'your beat'} (${beatNames}) and create something amazing with ${beatsCount > 1 ? 'them' : 'it'}!</p>
            
            <div style="margin: 25px 0; text-align: center;">
              <p style="font-style: italic; color: #666;">
                "Where words fail, music speaks" - Hans Christian Andersen
              </p>
            </div>
            
            <p>We'd love to hear your feedback or see what you create with our beats. Feel free to tag us on social media or respond to this email!</p>
            
            <div style="margin-top: 25px;">
              <p>Thank you for supporting independent music producers.</p>
              <p>The Dhuun Team</p>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; text-align: center;">
            <p>© ${new Date().getFullYear()} Dhuun. All rights reserved.</p>
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #7B2CBF; text-decoration: none; margin: 0 10px;">Website</a> | 
              <a href="#" style="color: #7B2CBF; text-decoration: none; margin: 0 10px;">Instagram</a> | 
              <a href="#" style="color: #7B2CBF; text-decoration: none; margin: 0 10px;">Twitter</a>
            </p>
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

// Export the transporter for custom email scenarios
export const getTransporter = () => transporter;

export default {
  sendOTPEmail,
  sendOrderConfirmation,
  sendThankYouEmail,
  getTransporter
};