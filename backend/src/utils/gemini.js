const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  throw new Error('GEMINI_API_KEY is required for Gemini integration');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Summarize invoice item notes using Gemini
 * @param {Array<string>} notes - Array of notes from invoice items
 * @returns {Promise<string>} - Summary text
 */
async function summarizeInvoiceNotes(notes) {
  try {
    const validNotes = notes.filter((note) => note && note.trim().length > 0);

    if (validNotes.length === 0) {
      return 'No notes available for summarization';
    }

    const notesText = validNotes.join('\n');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 200,
      },
    });

    const prompt = `You are an expert in reviewing and summarizing technical and financial documents. Your task is to summarize the following invoice item notes in a concise, professional manner. Focus on key details, important points, and any special requirements or conditions. Limit the summary to 200 words. Output only the summary—no headings, introductions, or extra text.

    Notes:
    ${notesText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return summary;
  } catch (error) {
    console.error('Error generating summary with Gemini:', error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

module.exports = {
  summarizeInvoiceNotes,
};
