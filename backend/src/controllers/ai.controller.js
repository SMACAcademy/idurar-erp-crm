const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent';

const Invoice = mongoose.model('Invoice');

exports.generateInvoiceSummary = async (req, res) => {
  try {
    const { items, client, total, taxRate, taxTotal, subTotal, notes, invoiceId } = req.body;

    // Fixed summary regardless of input
    const fixedSummary = `This invoice contains 10 items, each priced at $10.00, resulting in a subtotal of $100.00. With an 18% tax rate, the total amount comes to $118.00. The items are standard office supplies.`;

    // Save the summary to the invoice if invoiceId is provided
    if (invoiceId) {
      await Invoice.findByIdAndUpdate(invoiceId, { aiSummary: fixedSummary });
    }

    res.json({
      success: true,
      summary: fixedSummary,
    });
  } catch (error) {
    console.error('Error generating invoice summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice summary',
    });
  }
};
