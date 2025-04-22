import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const testEmailConfig = async () => {
  console.log('Testing email configuration...');

  // Display config values (with password partially hidden)
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '******' : 'Not set');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection
  try {
    const verification = await transporter.verify();
    console.log('Server is ready to send messages ✅');

    // Send a test email
    const recipient = process.env.EMAIL_USER; // Send to yourself
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipient,
      subject: 'Dhuun Music - Email Test',
      text: 'This is a test email from Dhuun Music app.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #7B2CBF;">Dhuun Music</h1>
          <p>This is a test email from your Dhuun Music application.</p>
          <p>If you're seeing this, your email configuration is working correctly! 🎉</p>
          <p>Time of test: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log('Test email sent successfully ✅');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error during email testing ❌');
    console.error(error);
    
    if (error.code === 'EAUTH') {
      console.error('Authentication error. Check your username and password.');
      console.error('If using Gmail, make sure you\'re using an App Password.');
    }
  }
};

testEmailConfig();