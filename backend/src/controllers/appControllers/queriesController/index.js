const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const create = require('./create');
const list = require("./list");
const read = require("./read.js")
const update = require("./update")
const remove = require('./remove');
const add = require("./add");
const deleteNote = require("./delete");
const methods = createCRUDController('queries');

methods.createQuery = create.createQuery;
methods.getQuery = list.getQuery;
methods.getQueryById = read.getQueryById;
methods.updateQuery = update.updateQuery;
methods.deleteQuery = remove.deleteQuery;
methods.addNoteToQuery = add.addNoteToQuery
methods.deleteNoteFromQuery = deleteNote.deleteNoteFromQuery

module.exports = methods;
