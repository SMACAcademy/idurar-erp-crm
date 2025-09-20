const express = require('express');
const router = express.Router();

const { routesList } = require('@/models/utils');
const appControllers = require('@/controllers/appControllers');

// Import custom query controller for special routes
const queryController = require('../../controllers/appControllers/queryController');

// Generate routes for all models automatically
// Test Gemini API connection
const testGeminiConnection = require('../../controllers/appControllers/invoiceController/testGemini');
router.get('/test-gemini', testGeminiConnection);

try {
  routesList.forEach(({ entity, controllerName }) => {
    try {
      const controller = appControllers[controllerName];
      
      if (controller && typeof controller === 'object' && !controller._id) {
        // CRUD routes - only add if the method exists
        if (controller.list && typeof controller.list === 'function') {
          router.get(`/${entity}/list`, controller.list);
        }
        if (controller.create && typeof controller.create === 'function') {
          router.post(`/${entity}/create`, controller.create);
        }
        if (controller.read && typeof controller.read === 'function') {
          router.get(`/${entity}/read/:id`, controller.read);
        }
        if (controller.update && typeof controller.update === 'function') {
          router.put(`/${entity}/update/:id`, controller.update);
        }
        if (controller.delete && typeof controller.delete === 'function') {
          router.delete(`/${entity}/delete/:id`, controller.delete);
        }
        
        // Additional routes - only add if the method exists
        if (controller.listAll && typeof controller.listAll === 'function') {
          router.get(`/${entity}/list/all`, controller.listAll);
        }
        if (controller.search && typeof controller.search === 'function') {
          router.get(`/${entity}/search`, controller.search);
        }
        if (controller.filter && typeof controller.filter === 'function') {
          router.get(`/${entity}/filter`, controller.filter);
        }
        if (controller.summary && typeof controller.summary === 'function') {
          router.get(`/${entity}/summary`, controller.summary);
        }
      } else {
        console.warn(`Controller ${controllerName} not found or invalid for entity ${entity}`);
      }
    } catch (err) {
      console.error(`Error setting up routes for ${entity}:`, err.message);
    }
  });
} catch (err) {
  console.error('Error in route generation:', err.message);
}

// Custom routes for queries (override the auto-generated ones)
router.get('/queries', queryController.paginatedList);
router.post('/queries', queryController.create);
router.get('/queries/:id', queryController.read);
router.put('/queries/:id', queryController.update);
router.delete('/queries/:id', queryController.remove);

// Notes routes
router.post('/queries/:id/notes', queryController.addNote);
router.delete('/queries/:id/notes/:noteId', queryController.removeNote);

const adminAuth = require('../../controllers/coreControllers/adminAuth');

// Invoice notes summary route
router.get('/invoice/:id/generateNotesSummary', adminAuth.isValidAuthToken, appControllers.invoiceController.generateNotesSummary);

// Explicit alias routes for clients list
// GET (existing)
router.get('/client/getclients', appControllers.clientController.list);

// POST alias to work like "client/create" but for listing
// Accepts pagination/search in req.body and forwards to the same list controller
router.post('/client/getclients', (req, res, next) => {
  const hasBody = req.body && Object.keys(req.body).length > 0;
  if (!hasBody) {
    // No body -> return ALL clients
    return appControllers.clientController.listAll(req, res, next);
  }
  // Body present -> treat as paginated list with filters
  req.query = { ...(req.query || {}), ...(req.body || {}) };
  return appControllers.clientController.list(req, res, next);
});

// Optional: also allow POST on /client/list (same behavior)
router.post('/client/list', (req, res, next) => {
  const hasBody = req.body && Object.keys(req.body).length > 0;
  if (!hasBody) {
    return appControllers.clientController.listAll(req, res, next);
  }
  req.query = { ...(req.query || {}), ...(req.body || {}) };
  return appControllers.clientController.list(req, res, next);
});

module.exports = router;
