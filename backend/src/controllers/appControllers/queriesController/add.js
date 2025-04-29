const mongoose = require('mongoose');
const Query = mongoose.model('queries');

const addNoteToQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { noteId, text, updatedBy } = req.body;

    const query = await Query.findById(id);
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    const noteIndex = query.notes.findIndex(note => note._id.toString() === noteId);

    if (noteIndex !== -1) {
      query.notes[noteIndex].text = text;
      query.notes[noteIndex].updatedAt = new Date();
      query.notes[noteIndex].updatedBy = updatedBy;
    } else {
      query.notes.push({ text, createdBy: updatedBy });
    }

    await query.save();
    // res.status(200).json({ result: query });
    res.status(200).json({ success: true, data: query });

  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addNoteToQuery }