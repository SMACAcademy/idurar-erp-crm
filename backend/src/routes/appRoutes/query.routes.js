const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const { isValidAuthToken } = require('@/controllers/coreControllers/adminAuth');
const queryController = require('@/controllers/appControllers/queryController/query');


router.use(isValidAuthToken);


router.route('/queries')
  .get(catchErrors(queryController.getQueries))
  .post(catchErrors(queryController.createQuery));

router.route('/queries/:id')
  .get(catchErrors(queryController.getQueryById))
  .patch(catchErrors(queryController.updateQuery))
  .delete(catchErrors(queryController.deleteQuery));


router.route('/queries/:id/notes')
  .post(catchErrors(queryController.addNote));

router.route('/queries/:id/notes/:noteId')
  .delete(catchErrors(queryController.deleteNote));

module.exports = router; 