const express = require("express");
const router = express.Router();

// your imports
const queryController = require("../../controllers/appControllers/queryController");

// your routes
router.get("/queries", queryController.paginatedList);
router.post("/queries", queryController.create);
router.get("/queries/:id", queryController.read);
router.put("/queries/:id", queryController.update);
router.delete("/queries/:id", queryController.remove);

// Notes routes
router.post("/queries/:id/notes", queryController.addNote);
router.delete("/queries/:id/notes/:noteId", queryController.removeNote);

module.exports = router;
