const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const QuerySchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true, autopopulate: true },
  description: { type: String, required: true },
  createdDate: { type: Date, default: Date.now },
  status: { type: String, enum: ["Open", "InProgress", "Closed"], default: "Open" },
  resolution: { type: String },
  notes: [NoteSchema],
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  updated: {
    type: Date,
    default: Date.now,
  },
});

QuerySchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model("Query", QuerySchema);
