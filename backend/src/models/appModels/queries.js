const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  text: { type: String, required: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: String },
  updatedAt: { type: Date },
});

const querySchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client', 
    required: true,
    autopopulate: true,
  },
  description: { type: String },
  createdDate: {
    type: Date,
    required: true,
  },
  status: { type: String, enum: ["Open", "InProgress", "Closed"], default: "Open" },
  resolution: { type: String, maxlength: 100 },
  notes: [noteSchema],
   removed: {
    type: Boolean,
    default: false,
  },
  
});
querySchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.models.queries || mongoose.model('queries', querySchema);