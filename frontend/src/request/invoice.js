import request from './request';

export const generateGeminiSummary = async (notes = []) => {
    return request.post({ entity: 'ai/summary', jsonData: { notes } });
};