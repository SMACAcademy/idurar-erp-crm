const Invoice = require('@/models/appModels/Invoice');
const OpenAI = require('openai');

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
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

    // Check if OpenAI is available
    if (!openai) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please set OPENAI_API_KEY environment variable.',
      });
    }

    // Prepare the prompt for AI
    const prompt = `
Please provide a concise summary of the following invoice item notes:

${itemNotes.join('\n')}

Please create a brief, professional summary that captures the key points and any important details from these notes.
    `.trim();

    // Call OpenAI API to generate summary
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes invoice item notes professionally and concisely.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const summary = completion.choices[0].message.content.trim();

    // Return the summary
    res.status(200).json({
      success: true,
      data: {
        summary,
        itemCount: itemNotes.length,
        invoiceId: id,
      },
    });

  } catch (error) {
    console.error('Error generating notes summary:', error);

    // Handle specific OpenAI errors
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'AI service error',
        error: error.response.data,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while generating summary',
      error: error.message,
    });
  }
};

module.exports = generateNotesSummary;