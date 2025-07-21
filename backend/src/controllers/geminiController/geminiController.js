const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
    apiVersion: 'v1',
});

exports.generateInvoiceNoteSummary = async (req, res) => {
    try {
        const { notes = [] } = req.body;

        if (!Array.isArray(notes) || notes.length === 0) {
            return res.status(400).json({ message: 'No notes provided for summary.' });
        }

        const prompt = `Summarize the following invoice item notes in a professional way:\n\n${notes
            .map((n, i) => `${i + 1}. ${n}`)
            .join('\n')}`;

        const model = genAI.getGenerativeModel({ model: 'models/gemini-pro' });

        const result = await model.generateContent([prompt]);
        const response = await result.response;
        const text = response.text();

        res.json({ summary: text });
    } catch (error) {
        console.error('Gemini summary error:', error.message);
        res.status(500).json({
            message: 'Failed to generate summary',
            error: error.message,
        });
    }
};
