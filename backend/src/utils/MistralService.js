const axios = require('axios');

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

async function generateSummary(text) {
  try {
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: 'mistral-small',  // or 'mistral-medium', 'mistral-large' based on your plan
        messages: [
          { role: 'system', content: 'You are a helpful assistant that summarizes text.' },
          { role: 'user', content: `Summarize the following text in 100 words: ${text}` }
        ],
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const summary = response.data.choices[0].message.content;
    return summary;
  } catch (error) {
    console.error('Mistral API error:', error.response?.data || error.message);
    throw new Error('Failed to generate summary.');
  }
}

module.exports = generateSummary;
