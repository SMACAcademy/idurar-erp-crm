const { google } = require('@ai-sdk/google');
const { generateText } = require('ai');
const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');
const generateSummary = async (content) => {
  console.log('Generating summary for content:', content);
  console.log('Content length:', process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  try {
    const { text } = await generateText({
      model: google('models/gemini-2.0-flash-lite-preview-02-05', {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),

      prompt: `
      You are a business development advocate.Analyze this financial content and provide a concise summary under 200 words.
      you will be given an array of strings.
      Focus on: key metrics, trends, risks, and opportunities.
      Use professional language.
      Return only the summary without additional commentary.
     Examples responses:
      1. "Financial review indicates 8% EBITDA growth despite inflationary pressures. Notable trends include APAC market expansion (contributing 22% new sales) and rising R&D spend (now 15% of revenue). Working capital efficiency declined (DSO increased to 45 days). Immediate opportunity lies in automating AR processes to improve cash flow."
      2. "The data shows conflicting signals: while gross profit improved to 40% through pricing actions, sales volume declined 5%. Emerging subscription model shows promise (28% MRR growth). Critical risk is the $12M debt maturity in Q4. Recommended action: Refinance debt while accelerating subscription transition."

      Content:
      ${content}
    `,
    });
    console.log('Generated summary:', text);
    return text;
  } catch (error) {
    console.error('Error generating summary:', error);
  }
};

async function geminiSummary(req, res) {
  const { id } = req.params;
  console.log(id);
  if (!id) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'ID is required',
    });
  }
  try {
    const notes = await Model.findById(id);
    console.log(notes);
    if (!notes) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No document found with this ID',
      });
    }
    const notesString = notes.items.map((note) => {
      return note.note;
    });
    console.log(notesString);
    const summary = await generateSummary(notesString);
    console.log(summary);
    return res.status(200).json({
      success: true,
      summary,
      message: 'Summary generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'ID is required',
    });
  }
}

module.exports = geminiSummary;
