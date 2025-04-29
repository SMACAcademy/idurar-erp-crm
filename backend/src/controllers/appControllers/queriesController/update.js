const mongoose = require("mongoose");
const Query = require("../../../models/appModels/queries");

const updateQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName: name, description, status, resolution, notes = [], createdDate } = req.body;

    const formattedNotes = notes.map(note =>
      typeof note === 'string' ? { text: note } : note
    );

    const objectIdName = new mongoose.Types.ObjectId(name);

    const updatedQuery = await Query.findByIdAndUpdate(
      id,
      {
        name: objectIdName,
        description,
        status,
        resolution,
        notes: formattedNotes,
        createdDate,
      },
      { new: true }
    );

    if (!updatedQuery) {
      return res.status(404).json({ message: "Query not found" });
    }

    // res.status(200).json(updatedQuery);
    res.status(200).json({ success: true, data: updatedQuery });

  } catch (err) {
    console.error("Update Query Error:", err);
    res.status(500).json({ message: "Failed to update query", error: err.message });
  }
};

module.exports = {
  updateQuery,
};
