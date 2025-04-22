const Query = require('../models/appModels/Query');
const { crudControllers } = require('../utils/crud');

const queryControllers = crudControllers(Query);

// Override getMany to handle status filtering
queryControllers.getMany = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const docs = await Query.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select('title description status priority customer createdBy updatedBy notes createdAt')
      .populate('customer', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('notes.createdBy', 'name');

    const total = await Query.countDocuments(query);

    res.status(200).json({
      success: true,
      result: docs,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Add note to query
queryControllers.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Note content is required' });
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }

    query.notes.push({
      content,
      createdBy: req.user._id,
    });

    await query.save();

    const updatedQuery = await Query.findById(id)
      .populate('customer', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('notes.createdBy', 'name');

    res.status(200).json({
      success: true,
      result: updatedQuery,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete note from query
queryControllers.deleteNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }

    const noteIndex = query.notes.findIndex((note) => note._id.toString() === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    query.notes.splice(noteIndex, 1);
    await query.save();

    const updatedQuery = await Query.findById(id)
      .populate('customer', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('notes.createdBy', 'name');

    res.status(200).json({
      success: true,
      result: updatedQuery,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update query status
queryControllers.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }

    query.status = status;
    query.updatedBy = req.user._id;

    await query.save();

    const updatedQuery = await Query.findById(id)
      .populate('customer', 'name')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('notes.createdBy', 'name');

    res.status(200).json({
      success: true,
      result: updatedQuery,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Override createOne to handle the correct parameters
queryControllers.createOne = async (req, res) => {
  try {
    const { title, description, customer, status, priority, createdBy } = req.body;

    // Create new query
    const newQuery = await Query.create({
      title,
      description,
      customer,
      status: status || 'pending',
      priority: priority || 'medium',
      createdBy: createdBy || '507f1f77bcf86cd799439011',
    });

    // Populate customer field
    const populatedQuery = await Query.findById(newQuery._id).populate('customer', 'name');

    return res.status(201).json({
      success: true,
      result: populatedQuery,
      message: 'Query created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = queryControllers;
