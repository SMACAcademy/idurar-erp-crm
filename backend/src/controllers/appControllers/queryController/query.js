const Query = require('@/models/appModels/Query');


const getQueries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status === 'all' ? {} : { status: req.query.status };

    const queries = await Query.find(status)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Query.countDocuments(status);

    res.json({
      success: true,
      result: queries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};



const getQueryById = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, error: 'Query not found' });
    res.json({ success: true, result: query });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};



const createQuery = async (req, res) => {
  try {
    const { customerName, description, status, resolution } = req.body;
    const newQuery = new Query({ 
      customerName, 
      description, 
      status, 
      resolution,
      createdBy: req.admin._id
    });
    await newQuery.save();
    res.status(201).json({ success: true, result: newQuery });
  } catch (error) {
    console.error('Error creating query:', error);
    res.status(400).json({ success: false, error: error.message || 'Invalid data' });
  }
};



const updateQuery = async (req, res) => {
  try {
    const { customerName, description, status, resolution } = req.body;
    const updatedQuery = await Query.findByIdAndUpdate(
      req.params.id,
      { customerName, description, status, resolution },
      { new: true }
    );
    if (!updatedQuery) return res.status(404).json({ success: false, error: 'Query not found' });
    res.json({ success: true, result: updatedQuery });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid update' });
  }
};



const addNote = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, error: 'Query not found' });

    const newNote = {
      content: req.body.content,
      createdBy: req.admin._id
    };
    query.notes.push(newNote);
    await query.save();

    res.status(201).json({ success: true, result: query.notes });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Could not add note' });
  }
};



const deleteNote = async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) return res.status(404).json({ success: false, error: 'Query not found' });

    query.notes = query.notes.filter(
      note => note._id.toString() !== req.params.noteId
    );
    await query.save();

    res.json({ success: true, result: query.notes });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Could not delete note' });
  }
};

const deleteQuery = async (req, res) => {
  try {
    const query = await Query.findByIdAndDelete(req.params.id);
    if (!query) {
      return res.status(404).json({ success: false, error: 'Query not found' });
    }
    res.json({ success: true, result: query });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  getQueries,
  getQueryById,
  createQuery,
  updateQuery,
  addNote,
  deleteNote,
  deleteQuery,
};
