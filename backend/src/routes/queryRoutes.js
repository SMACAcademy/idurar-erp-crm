const express = require("express");
const router = express.Router();
const Query = require("../models/Query");

// Get all queries with pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const queries = await Query.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new query
router.post("/", async (req, res) => {
  const query = new Query(req.body);
  try {
    const newQuery = await query.save();
    res.status(201).json(newQuery);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get a specific query by ID
router.get("/:id", async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });
    res.json(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a query status or resolution
router.put("/:id", async (req, res) => {
  try {
    const updatedQuery = await Query.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedQuery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a note to a query
router.post("/:id/notes", async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });
    
    query.notes.push({ text: req.body.text });
    await query.save();
    
    res.json(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a note from a query
router.delete("/:id/notes/:noteId", async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ message: "Query not found" });

    query.notes = query.notes.filter((note) => note._id.toString() !== req.params.noteId);
    await query.save();

    res.json(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
