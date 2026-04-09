require('dotenv').config();
const AIService = require('../../src/services/ai');

async function testAI() {
  console.log('Testing AI Service...');

  try {
    if (!process.env.AI_API_KEY) {
      console.warn('⚠️  AI_API_KEY not set in .env. Skipping real AI test.');
      return;
    }

    const userData = { role: 'candidate', first_name: 'Test User' };
    const message = 'I want to become a software engineer. What should I learn?';

    console.log(`Sending message: "${message}"`);
    const response = await AIService.generateCareerAdvice(userData, message);

    console.log('AI Response:', response);

    if (response && !response.includes("I'm sorry")) {
      console.log('✅ AI Service working correctly!');
    } else {
      console.log('⚠️  AI Service returned fallback or error message.');
    }
  } catch (error) {
    console.error('❌ Error during AI test:', error);
  }
}

testAI();
