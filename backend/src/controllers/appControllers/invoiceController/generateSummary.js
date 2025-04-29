const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const generateSummary = async (req, res) => {
    const { note } = req.body;

    if (!note) {
        return res.status(400).json({ message: 'Note is required' });
    }

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: `Summarize the following notes: ${note}`
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (summary) {
            return res.status(200).json({ success: true, data: summary });
        } else {
            return res.status(500).json({ message: 'No summary in Gemini response' });
        }
    } catch (error) {
        console.error('Error calling Gemini:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { generateSummary };
