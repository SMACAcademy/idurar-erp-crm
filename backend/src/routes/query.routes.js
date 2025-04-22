const express = require('express');
const queryController = require('../controllers/query.controller');
const { validateToken } = require('../middlewares/validateToken');

const router = express.Router();

// List endpoint
router.get('/list', validateToken, queryController.getMany);

// CRUD endpoints
router
  .route('/')
  .get(validateToken, queryController.getMany)
  .post(validateToken, queryController.createOne);

router
  .route('/:id')
  .get(validateToken, queryController.getOne)
  .put(validateToken, queryController.updateOne)
  .delete(validateToken, queryController.removeOne);

// Notes endpoints
router.post('/:id/notes', validateToken, queryController.addNote);
router.delete('/:id/notes/:noteId', validateToken, queryController.deleteNote);

// Status update endpoint
router.put('/:id/status', validateToken, queryController.updateStatus);

module.exports = router;
