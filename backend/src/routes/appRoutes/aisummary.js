
const express = require('express');
const route=express.Router();
const generateSummary = require('../../controllers/appControllers/invoiceController/geminisummary');
route.get('/invoice/summary/:id',generateSummary)
module.exports = route;