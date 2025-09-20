require('dotenv').config();

const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Invoice');

const sendMail = require('./sendMail');
const create = require('./create');
const summary = require('./summary');
const update = require('./update');
const remove = require('./remove');
const paginatedList = require('./paginatedList');
const read = require('./read');
const generateNotesSummary = require('./generateNotesSummary');

// expose both "mail" and "sendInvoiceMail" for routing flexibility
methods.mail = sendMail;
methods.sendInvoiceMail = sendMail;

methods.create = create;
methods.update = update;
methods.delete = remove;
methods.summary = summary;
methods.list = paginatedList;
methods.read = read;
methods.generateNotesSummary = generateNotesSummary;

module.exports = methods;
