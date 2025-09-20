const express = require('express');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');

// Use the existing payment controller methods (custom + CRUD factory)
const ctrl = appControllers.paymentController;

// If controller not loaded for any reason, export empty router to avoid crashes
if (!ctrl) {
  module.exports = router;
} else {
  // Unauthenticated Payment endpoints (public)
  // Mirrors the auto-routed endpoints but without adminAuth

  // List (paginated) and list all
  router.get('/payment/list', ctrl.list);
  router.get('/payment/list/all', ctrl.listAll);

  // Search and filter
  router.get('/payment/search', ctrl.search);
  router.get('/payment/filter', ctrl.filter);

  // Summary
  router.get('/payment/summary', ctrl.summary);

  // Read single
  router.get('/payment/read/:id', ctrl.read);

  // Create / Update / Delete
  router.post('/payment/create', ctrl.create);
  router.put('/payment/update/:id', ctrl.update);
  router.delete('/payment/delete/:id', ctrl.delete);
}

module.exports = router;