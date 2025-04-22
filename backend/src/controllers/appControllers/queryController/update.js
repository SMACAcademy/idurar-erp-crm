const mongoose = require('mongoose');

const Model = mongoose.model('Query');

const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');
const schema = require('./schemaValidate');

const update = async (req, res) => {
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

  const previousQuery = await Model.findOne({
    _id: req.params.id,
    removed: false,
  });

  const { notes = [] } = req.body;

  body['notes'] = notes;
  body['pdf'] = 'query-' + req.params.id + '.pdf';

  // Find document by id and updates with the required fields

  const result = await Model.findOneAndUpdate({ _id: req.params.id, removed: false }, body, {
    new: true, // return the new result instead of the old one
  }).exec();

  // Returning successfull response

  return res.status(200).json({
    success: true,
    result,
    message: 'we update this document ',
  });
};

module.exports = update;
