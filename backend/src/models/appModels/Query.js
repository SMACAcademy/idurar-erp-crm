// models/Query.js
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: { type: String },
  createdAt: { type: Date, default: Date.now },
  removed: {
    type: Boolean,
    default: false,
  },
});

const querySchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true,
  },

  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    required: true,
    autopopulate: true,
  },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Closed'],
    default: 'Open',
  },
  resolution: {
    type: String,
    maxlength: 100,
  },
  notes: [noteSchema],
  createdAt: { type: Date, default: Date.now },
  removed: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Query', querySchema);
