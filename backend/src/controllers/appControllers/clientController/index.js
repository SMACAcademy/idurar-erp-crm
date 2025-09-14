const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const summary = require('./summary');

function modelController() {
  const methods = createCRUDController('Client');

  methods.summary = (req, res) => {
    const Model = mongoose.model('Client');
    return summary(Model, req, res);
  };
  return methods;
}

module.exports = modelController();
