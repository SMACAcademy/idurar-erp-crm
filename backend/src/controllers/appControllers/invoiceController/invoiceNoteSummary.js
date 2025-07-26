const Invoice = require('@/models/appModels/Invoice');
const generateSummaryFromNotes = require('@/utils/geminiService');

const generateAIInvoiceSummary = async (req, res) => {
    const invoiceId = req.params.id;
    try {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        const notes = invoice.items.map((item) => item.itemNote).filter(Boolean);
        const summary = await generateSummaryFromNotes(notes);
        return res.status(200).json({ summary });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
};

module.exports = generateAIInvoiceSummary;