const express = require('express');
const { catchErrors } = require('../../handlers/errorHandlers');
const queryController = require('../../controllers/QueryController/QueryController');
const router = express.Router();

router.get('/queries', catchErrors(queryController.getQueries));
router.get('/queries/:id', catchErrors(queryController.getQuery));
router.post('/queries', catchErrors(queryController.createQuery));
router.put('/queries/:id', catchErrors(queryController.updateQuery));
router.post('/queries/:id/notes', catchErrors(queryController.addNote));
router.delete('/queries/:id/notes/:noteId', catchErrors(queryController.deleteNote));
router.get('/queries/:id/summary', catchErrors(queryController.generateQuerySummary));
router.delete('/queries/:id', catchErrors(queryController.deleteQuery));

module.exports = router;