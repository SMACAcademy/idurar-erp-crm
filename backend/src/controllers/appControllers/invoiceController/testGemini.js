const { GoogleGenerativeAI } = require('@google/generative-ai');

// Sanitize and validate Gemini API key
const sanitizeGeminiKey = (k) => {
  if (!k) return null;
  const trimmed = String(k).trim().replace(/^["']|["']$/g, '');
  const placeholder = /^(YOUR_NEW_GEMINI_API_KEY_HERE|YOUR.*GEMINI.*API.*KEY.*)$/i;
  if (placeholder.test(trimmed)) return '__PLACEHOLDER__';
  return trimmed;
};

const maskKey = (k) => (k && k.length > 8 ? `${k.slice(0, 4)}...${k.slice(-4)}` : k);

const testGeminiConnection = async (req, res) => {
  try {
    console.log('Testing Gemini connection with key (masked):', maskKey(process.env.GEMINI_API_KEY));
    
    const resolvedKey = sanitizeGeminiKey(process.env.GEMINI_API_KEY);
    if (!resolvedKey || resolvedKey === '__PLACEHOLDER__') {
      throw new Error('Invalid or placeholder GEMINI_API_KEY');
    }
    const genAI = new GoogleGenerativeAI(resolvedKey);
    console.log('Initialized GoogleGenerativeAI');
    
    const modelName = (process.env.GEMINI_MODEL && String(process.env.GEMINI_MODEL).trim()) || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log('Got model reference:', modelName);
    
    const prompt = "Say hello";
    console.log('Sending test prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    console.log('Got result');
    
    const response = await result.response;
    console.log('Got response');
    
    const text = response.text();
    console.log('Got text:', text);
    
    res.json({
      success: true,
      message: 'Gemini API test successful',
      response: text
    });
  } catch (error) {
    console.error('Gemini API Test Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Gemini API test failed',
      error: {
        message: error.message,
        details: error.errorDetails || error
      }
    });
  }
};

module.exports = testGeminiConnection;