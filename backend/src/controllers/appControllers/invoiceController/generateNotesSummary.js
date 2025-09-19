const Invoice = require('@/models/appModels/Invoice');
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

// Initialize Gemini AI client once using sanitized key
let genAI = null;
const resolvedKey = sanitizeGeminiKey(process.env.GEMINI_API_KEY);

if (!resolvedKey || resolvedKey === '__PLACEHOLDER__') {
  console.error('GEMINI_API_KEY invalid or not set; value (masked):', maskKey(process.env.GEMINI_API_KEY));
} else {
  genAI = new GoogleGenerativeAI(resolvedKey);
}

const generateNotesSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the invoice by ID
    const invoice = await Invoice.findById(id).populate('client');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    // Extract notes from all items
    const itemNotes = invoice.items
      .map((item, index) => {
        if (item.notes && item.notes.trim()) {
          return `Item ${index + 1} (${item.itemName}): ${item.notes.trim()}`;
        }
        return null;
      })
      
      .filter(note => note !== null);

    // Check if there are any notes to summarize
    if (itemNotes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No notes found in invoice items to summarize',
      });
    }

    // Check if Gemini is available
    if (!genAI) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please set GEMINI_API_KEY environment variable.',
      });
    }

    // Prepare the prompt for AI
    const prompt = `
Please provide an extensive and detailed summary of the following invoice item notes, including comprehensive coverage of all points, in-depth analysis, and practical suggestions based on the content:
${itemNotes.join('\n')}


Please create a thorough, professional summary that elaborates on each key point, provides additional context where relevant, includes detailed explanations of any implications, and offers actionable suggestions or recommendations derived from the notes to improve processes, address issues, or enhance outcomes.
    `.trim();
    console.log('Gemini key (masked):', maskKey(process.env.GEMINI_API_KEY));

    // Initialize Gemini model (configurable via GEMINI_MODEL, default: gemini-1.5-flash)
    const modelName = (process.env.GEMINI_MODEL && String(process.env.GEMINI_MODEL).trim()) || 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log('Model initialized:', modelName);

    // Generate summary using Gemini
    try {
      console.log('Attempting to generate content with prompt:', prompt);
      const result = await model.generateContent(prompt);
      console.log('Content generated, getting response');
      const response = await result.response;
      console.log('Got response, extracting text');
      const summary = response.text().trim();

      // Return the summary
      res.status(200).json({
        success: true,
        data: {
          summary,
          itemCount: itemNotes.length,
          invoiceId: id,
        },
      });
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      return res.status(500).json({
        success: false,
        message: 'Error while generating summary with Gemini API',
        error: geminiError.message || 'Unknown Gemini API error',
      });
    }

  } catch (error) {
    console.error('Error in generateNotesSummary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing the request',
      error: error.message,
    });
  }
};

module.exports = generateNotesSummary;