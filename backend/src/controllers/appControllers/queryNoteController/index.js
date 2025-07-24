const Query = require("@/models/appModels/Query");

exports.addNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { message } = req.body;

        const query = await Query.findByIdAndUpdate(
            id,
            { $push: { notes: { message } } },
            { new: true }
        );

        if (!query)
            return res.status(404).json({ success: false, message: 'Query not found' });

        res.status(200).json({ success: true, result: query });
    } catch (err) {
        console.error('Error in adding note:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


exports.deleteNote = async (req, res) => {
    try {
        const { id, noteId } = req.params;

        const query = await Query.findByIdAndUpdate(
            id,
            { $pull: { notes: { _id: noteId } } },
            { new: true }
        );

        if (!query)
            return res.status(404).json({ success: false, message: 'Query not found' });

        res.status(200).json({ success: true, result: query });
    } catch (err) {
        console.error('Error in deleting note:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
