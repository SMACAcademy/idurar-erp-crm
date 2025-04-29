const mongoose = require("mongoose");
const Query = require("../../../models/appModels/queries");

const createQuery = async (req, res) => {
  try {
    const { customerName: name, description, status, resolution, notes = [], createdDate } = req.body;

    const formattedNotes = notes.map(note =>
      typeof note === 'string' ? { text: note } : note
    );
    const objectIdName = new mongoose.Types.ObjectId(name);

    const query = await Query.create({
      name: objectIdName,
      description,
      status,
      resolution,
      notes: formattedNotes,
      createdDate: createdDate
    });
    res.status(201).json({ success: true, data: query });
  } catch (err) {
    console.error("Create Query Error:", err);
    res.status(500).json({ message: "Failed to create query", error: err.message });
  }
};
module.exports = {
  createQuery
};
