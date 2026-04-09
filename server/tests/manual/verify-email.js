require('dotenv').config();
const EmailService = require('../../src/services/email');

async function testEmail() {
  console.log('Testing Email Service...');

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  EMAIL_USER or EMAIL_PASS not set in .env. Skipping real email test.');
      return;
    }

    const result = await EmailService.sendWelcomeEmail(
      process.env.EMAIL_USER, // Send to self for testing
      'Test User'
    );

    if (result) {
      console.log('✅ Email sent successfully!');
    } else {
      console.error('❌ Failed to send email.');
    }
  } catch (error) {
    console.error('❌ Error during email test:', error);
  }
}

testEmail();
