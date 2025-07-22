const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const paginatedList = require('./paginatedList');
const createNote = require('./createNote');
const deleteNote = require('./deleteNote');

function modelController() {
  const Model = mongoose.model('Queries');
  const methods = createCRUDController('Queries');

  methods.getQueries = (req, res) => paginatedList(Model, req, res);
  methods.createNote = (req, res) => createNote(Model, req, res);
  methods.deleteNote = (req, res) => deleteNote(Model, req, res);

  return methods;
}

module.exports = modelController();
