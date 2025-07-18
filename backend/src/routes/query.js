const express = require('express');
const router = express.Router();
const Query = require('../models/Query');

// GET /api/queries?page=&limit=
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  try {
    const [queries, total] = await Promise.all([
      Query.find(filter).sort({ createdDate: -1 }).skip(skip).limit(limit),
      Query.countDocuments(filter),
    ]);
    res.json({ data: queries, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/queries
router.post('/', async (req, res) => {
  try {
    const query = new Query(req.body);
    await query.save();
    res.status(201).json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/queries/:id
router.get('/:id', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Not found' });
    res.json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/queries/:id
router.put('/:id', async (req, res) => {
  try {
    const query = await Query.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!query) return res.status(404).json({ error: 'Not found' });
    res.json(query);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/queries/:id/notes
router.post('/:id/notes', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Not found' });
    query.notes.push({ text: req.body.text });
    await query.save();
    res.status(201).json(query.notes[query.notes.length - 1]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/queries/:id/notes/:noteId
router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ error: 'Not found' });
    const note = query.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    note.remove();
    await query.save();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
