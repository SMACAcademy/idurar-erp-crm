const express = require('express');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');

// Use existing invoice controller (custom + CRUD factory)
const ctrl = appControllers.invoiceController;

// If controller not loaded, export empty router to avoid crashes
if (!ctrl) {
  module.exports = router;
} else {
  // Public (no-auth) endpoint to email invoice PDF
  // Frontend calls POST /api/invoice/mail with JSON body: { invoiceId, email, subject? }
  router.post('/invoice/mail', ctrl.sendInvoiceMail);
}

module.exports = router;