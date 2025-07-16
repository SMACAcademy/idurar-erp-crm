const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const Model = mongoose.model('Invoice');

const generateNotesSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Model.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    const notes = (invoice.items || [])
      .map((item) => item.note && item.note.trim())
      .filter(Boolean);
    if (!notes.length) {
      return res.status(200).json({ success: true, summary: '', message: 'No notes to summarize.' });
    }
    const prompt = `Summarize the following invoice item notes in a concise paragraph:\n${notes.join('\n')}`;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Gemini API key not configured.' });
    }
    const genAI = new GoogleGenAI({ apiKey });
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    invoice.notesSummary = summary;
    await invoice.save();
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = generateNotesSummary; 