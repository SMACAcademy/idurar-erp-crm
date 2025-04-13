const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const { isValidAuthToken } = require('@/controllers/coreControllers/adminAuth');
const queryController = require('@/controllers/appControllers/queryController/query');

// Apply authentication middleware to all routes
router.use(isValidAuthToken);

// Query routes
router.route('/queries')
  .get(catchErrors(queryController.getQueries))
  .post(catchErrors(queryController.createQuery));

router.route('/queries/:id')
  .get(catchErrors(queryController.getQueryById))
  .patch(catchErrors(queryController.updateQuery))
  .delete(catchErrors(queryController.deleteQuery));

// Note management routes
router.route('/queries/:id/notes')
  .post(catchErrors(queryController.addNote));

router.route('/queries/:id/notes/:noteId')
  .delete(catchErrors(queryController.deleteNote));

module.exports = router; 