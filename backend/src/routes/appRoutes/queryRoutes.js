const express = require('express');
const router = express.Router();
const queryController = require('../../controllers/queryController/queryController');

router.get('/', queryController.getQueries);
router.post('/', queryController.createQuery);
router.get('/:id', queryController.getQueryById);
router.put('/:id', queryController.updateQuery);
router.post('/:id/notes', queryController.addNoteToQuery);
router.delete('/:id/notes/:noteId', queryController.deleteNoteFromQuery);

module.exports = router;
