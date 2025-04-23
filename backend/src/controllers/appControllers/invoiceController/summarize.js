const mongoose = require('mongoose');
const Model = mongoose.model('Invoice');
const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /api/gemini/summarize

const summarize = async (req, res) => {
  // Find document by id
  const result = await Model.findOne({
    _id: req.params.id,
    removed: false,
  })
    .populate('createdBy', 'name')
    .exec();
  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  }

  const notes = result.items;

  if (!notes || !Array.isArray(notes) || notes.length === 0) {
    return res.status(400).json({ success: false, message: 'No notes provided' });
  }
  // 🔍 Filter only items that have a valid non-empty note
  const itemsWithNotes = notes.filter((item) => item.note && item.note.trim().length > 0);

  if (itemsWithNotes.length === 0) {
    return res
      .status(200)
      .json({ success: true, message: 'No notes found in items to summarize', result });
  }

  try {
    const prompt = itemsWithNotes.map((item) => `- ${item.note}`).join('\n');

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Summarize the following content directly. Return only the summary text — do not include any introductions, explanations, or filler:\n\n${prompt}`,
            },
          ],
        },
      ],
    };

    const geminiRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const summary =
      geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary generated';
    console.log('geminiRes', summary);
    const updateResult = await Model.findOneAndUpdate(
      { _id: req.params.id, removed: false },
      { $set: { generatedSummary: summary } },
      {
        new: true, // return the new result instead of the old one
      }
    ).exec();

    console.log('updateResult', updateResult);

    return res
      .status(200)
      .json({ success: true, result: updateResult, message: 'Summary generated successfully' });
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary',
      details: err.response?.data || err.message,
    });
  }
  // Return success resposne
  return res.status(200).json({
    success: true,
    result,
    message: 'we found this document ',
  });
};

module.exports = summarize;
