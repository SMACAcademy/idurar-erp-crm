const mongoose = require('mongoose');
const axios = require('axios');
const { InferenceClient } = require('@huggingface/inference');

const Model = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');
const custom = require('@/helpers/custom'); // Assuming custom.generatePDF is defined here

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

async function generateGeminiSummary(items) {
  const notes = items.map(item => item.notes).filter(note => note).join(' ');
  if (!notes) return 'No notes available';

  try {
    const chatCompletion = await client.chatCompletion({
      provider: 'nebius',
      model: 'deepseek-ai/DeepSeek-V3-0324',
      messages: [
        {
          role: 'user',
          content: `Summarize the following notes: ${notes}`,
        },
      ],
      max_tokens: 500,
    });

    return chatCompletion.choices[0].message.content || 'No summary generated';
  } catch (error) {
    console.error('Error generating Gemini summary:', error);
    return 'Error generating summary';
  }
}

const create = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [], taxRate = 0, discount = 0 } = value;

  // default
  let subTotal = 0;
  let taxTotal = 0;
  let total = 0;

  //Calculate the items array with subTotal, total, taxTotal
  items.map((item) => {
    let total = calculate.multiply(item['quantity'], item['price']);
    //sub total
    subTotal = calculate.add(subTotal, total);
    //item total
    item['total'] = total;
  });
  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  total = calculate.add(subTotal, taxTotal);

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = items;

  const geminiSummary = await generateGeminiSummary(items);
  body['geminiSummary'] = geminiSummary;

  let paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';

  body['paymentStatus'] = paymentStatus;
  body['createdBy'] = req.admin._id;

  // Creating a new document in the collection
  const result = await new Model(body).save();
  const fileId = 'invoice-' + result._id + '.pdf';
  const pdfContent = {
    ...body,
    geminiSummary: body.geminiSummary,
  };
  await custom.generatePDF(pdfContent, fileId);
  const updateResult = await Model.findOneAndUpdate(
    { _id: result._id },
    { pdf: fileId },
    {
      new: true,
    }
  ).exec();
  // Returning successfull response

  increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully',
  });
};

module.exports = create;
