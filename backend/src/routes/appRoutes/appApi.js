const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();
const axios = require('axios');

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');
const { generateGeminiSummary } = require('@/controllers/appControllers/invoiceController/create');

const routerApp = (entity, controller) => {
  router.route(`/${entity}/create`).post(catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
  }
};

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});

router.post('/api/invoice/generate-summary', async (req, res) => {
  console.log('Request received at /api/invoice/generate-summary');
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid items data' });
    }

    const summary = await generateGeminiSummary(items);
    res.status(200).json({ success: true, result: { summary } });
  } catch (error) {
    console.error('Error in /api/invoice/generate-summary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/api/invoice/save', async (req, res) => {
  try {
    const { client, number, year, status, date, expiredDate, notes, items, taxRate, subTotal, taxTotal, total } = req.body;

    // Validate required fields
    if (!client || !number || !year || !status || !date || !expiredDate || !items) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Simulate saving the invoice to the database
    const savedInvoice = {
      client,
      number,
      year,
      status,
      date,
      expiredDate,
      notes,
      items,
      taxRate,
      subTotal,
      taxTotal,
      total,
    };

    console.log('Invoice saved:', savedInvoice);

    res.status(200).json({ success: true, message: 'Invoice saved successfully', result: savedInvoice });
  } catch (error) {
    console.error('Error saving invoice:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/api/ai-query', async (req, res) => {
  const userInput = req.body.query;
  const apiUrl = 'https://router.huggingface.co/fireworks-ai/v1/chat/completions';
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  const data = {
    model: 'accounts/perplexity/models/r1-1776',
    messages: [
      {
        role: 'user',
        content: userInput,
      },
    ],
    max_tokens: 500,
    stream: false,
  };

  try {
    const response = await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    res.status(200).json({ success: true, result: response.data });
  } catch (error) {
    console.error('Error querying Hugging Face API:', error);
    res.status(500).json({ success: false, message: 'Failed to query AI', error: error.message });
  }
});

module.exports = router;
