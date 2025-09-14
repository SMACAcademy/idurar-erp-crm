const express = require('express');
const router = express.Router();

const { routesList } = require('@/models/utils');
const appControllers = require('@/controllers/appControllers');

// Import custom query controller for special routes
const queryController = require('../../controllers/appControllers/queryController');

// Generate routes for all models automatically
try {
  routesList.forEach(({ entity, controllerName }) => {
    try {
      const controller = appControllers[controllerName];
      
      if (controller && typeof controller === 'object' && !controller._id) {
        // CRUD routes - only add if the method exists
        if (controller.list && typeof controller.list === 'function') {
          router.get(`/${entity}`, controller.list);
        }
        if (controller.create && typeof controller.create === 'function') {
          router.post(`/${entity}`, controller.create);
        }
        if (controller.read && typeof controller.read === 'function') {
          router.get(`/${entity}/:id`, controller.read);
        }
        if (controller.update && typeof controller.update === 'function') {
          router.put(`/${entity}/:id`, controller.update);
        }
        if (controller.delete && typeof controller.delete === 'function') {
          router.delete(`/${entity}/:id`, controller.delete);
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

module.exports = router;
