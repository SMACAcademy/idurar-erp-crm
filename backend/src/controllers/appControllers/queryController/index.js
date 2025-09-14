const create = require("../../middlewaresControllers/createCRUDController/create");
const update = require("../../middlewaresControllers/createCRUDController/update");
const read = require("../../middlewaresControllers/createCRUDController/read");
const remove = require("../../middlewaresControllers/createCRUDController/remove");
const paginatedList = require("../../middlewaresControllers/createCRUDController/paginatedList");

const Query = require("../../../models/appModels/Query");

// Custom paginated list with filtering support
const customPaginatedList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build filter object
    const filter = { removed: false };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const [results, total] = await Promise.all([
      Query.find(filter).populate('customerId').skip(skip).limit(limit).sort({ createdDate: -1 }),
      Query.countDocuments(filter)
    ]);

    res.json({ data: results, total, page, limit });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching queries',
      error: error.message
    });
  }
};

// Custom functions for notes management
const addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Note text is required'
      });
    }

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    query.notes.push({ text });
    await query.save();

    return res.status(200).json({
      success: true,
      result: query,
      message: 'Note added successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
};

const removeNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Query not found'
      });
    }

    const noteIndex = query.notes.findIndex(note => note._id.toString() === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    query.notes.splice(noteIndex, 1);
    await query.save();

    return res.status(200).json({
      success: true,
      result: query,
      message: 'Note removed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error removing note',
      error: error.message
    });
  }
};

module.exports = {
  create: (req, res) => create(Query, req, res),
  update: (req, res) => update(Query, req, res),
  read: (req, res) => read(Query, req, res),
  remove: (req, res) => remove(Query, req, res),
  paginatedList: customPaginatedList,
  addNote,
  removeNote,
};
