const mongoose = require("mongoose");
const Query = require("../../../models/appModels/queries");
const deleteNoteFromQuery = async (req, res) => {
    try {
        const { id, noteId } = req.params;

        const query = await Query.findById(id);
        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        const noteIndex = query.notes.findIndex(note => note._id.toString() === noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ message: 'Note not found in the query' });
        }

        query.notes.splice(noteIndex, 1);
        await query.save();

        return res.status(200).json({ success: true, result: query });
    } catch (err) {
        console.error('Error deleting note:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { deleteNoteFromQuery };
