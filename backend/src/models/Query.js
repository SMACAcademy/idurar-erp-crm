const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: true }); // Ensure _id is always present

const QuerySchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  description: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Open', 'InProgress', 'Closed'], default: 'Open' },
  resolution: { type: String },
  notes: [NoteSchema],
});

module.exports = mongoose.model('Query', QuerySchema);
