const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const { summarizeInvoiceNotes } = require('@/utils/gemini');

const router = express.Router();

// Route for summarizing invoice notes
router.post('/summarize-notes', catchErrors(async (req, res) => {
  const { notes } = req.body;
  
  if (!notes || !Array.isArray(notes)) {
    return res.status(400).json({
      success: false,
      message: 'Notes array is required',
    });
  }

  try {
    const summary = await summarizeInvoiceNotes(notes);
    return res.status(200).json({
      success: true,
      result: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}));

module.exports = router; 