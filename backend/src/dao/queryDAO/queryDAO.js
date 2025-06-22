const { default: mongoose } = require('mongoose');
const Query = require('../../models/appModels/Query')

const createQuery = async (data) => {
    const query = new Query(data);
    return await query.save();
}

const getQueries = async ({ skip, limit, status }) => {
    const filter = {};
    if (status) {
        filter.status = status;
    }

    const [queries, total] = await Promise.all([
        Query.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean().populate('client', 'name'),
        Query.countDocuments(filter).lean()
    ])
    return {
        queries,
        total
    };
};

const getQueryById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid Query ID');
        error.code = 400;
        throw error;
    }
    return await Query.findById(id).lean().populate('client', 'name');
};

const updateQuery = async (id, data) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error('Invalid Query ID');
        error.code = 400;
        throw error;
    }
    return await Query.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
}

const addNote = async (queryId, content) => {
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
        const error = new Error('Invalid Query ID');
        error.code = 400;
        throw error;
    }
    const query = await Query.findById(queryId);
    if (!query) {
        const error = new Error('Query not found');
        error.code = 404;
        throw error;
    }

    query.notes.push({ content });
    return await query.save();
};

const deleteNote = async (queryId, noteId) => {
    if (!mongoose.Types.ObjectId.isValid(queryId)) {
        const error = new Error("Invalid Query ID");
        error.code = 400;
        throw error;
    }

    const query = await Query.findById(queryId);
    if (!query) throw new Error("Query not found");

    const note = query.notes.id(noteId);
    if (!note) throw new Error("Note not found");

    note.deleteOne();
    return await query.save();
};


module.exports = {
    createQuery,
    getQueries,
    getQueryById,
    updateQuery,
    addNote,
    deleteNote
}