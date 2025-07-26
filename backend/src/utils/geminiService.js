const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const generateSummaryFromNotes = async (notes) => {
    if (!notes.length) return '';
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Summarize the following invoice item notes into a concise paragraph:\n\n${notes.join('\n- ')}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
};

module.exports = generateSummaryFromNotes;