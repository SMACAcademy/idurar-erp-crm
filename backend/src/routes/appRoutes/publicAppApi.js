const express = require('express');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');

// Public (no auth) Clients endpoints
// Refined routes (no token required)
// - GET /public-api/clients          -> paginated list with filters
// - GET /public-api/clients/all      -> all (no pagination)
// Backward compatible aliases remain available

// New refined public endpoints
router.get('/clients', appControllers.clientController.list);
router.get('/clients/all', appControllers.clientController.listAll);

// Backward compatible aliases
router.get('/client/list', appControllers.clientController.list);
router.get('/client/list/all', appControllers.clientController.listAll);
router.get('/client/getclients', appControllers.clientController.list);

module.exports = router;