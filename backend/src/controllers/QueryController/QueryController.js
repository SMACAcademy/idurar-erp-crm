const QueryModals = require("@/models/QueryModals/QueryModals");


// GET all with pagination
exports.getQueries = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const queries = await QueryModals.find()
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  res.json(queries);
};

// GET single
exports.getQuery = async (req, res) => {
  const query = await QueryModals.findById(req.params.id);
  if (!query) return res.status(404).json({ error: 'Query not found' });
  res.json(query);
};

// POST create
exports.createQuery = async (req, res) => {
  const { customerName, description, status, resolution } = req.body;
  const newQuery = await QueryModals.create({ customerName, description, status, resolution });
  res.status(201).json(newQuery);
};

// PUT update status/resolution
exports.updateQuery = async (req, res) => {
  const { status, resolution } = req.body;
  const updated = await QueryModals.findByIdAndUpdate(
    req.params.id,
    { status, resolution },
    { new: true }
  );
  res.json(updated);
};

// POST add note
exports.addNote = async (req, res) => {
  const { text } = req.body;
  const query = await QueryModals.findById(req.params.id);
  if (!query) return res.status(404).json({ error: 'Query not found' });
  query.notes.push({ text });
  await query.save();
  res.json(query.notes);
};

// DELETE note
exports.deleteNote = async (req, res) => {
  const { id, noteId } = req.params;
  const query = await QueryModals.findById(id);
  if (!query) return res.status(404).json({ error: 'Query not found' });
  query.notes = query.notes.filter(note => note._id.toString() !== noteId);
  await query.save();
  res.json(query.notes);
};
