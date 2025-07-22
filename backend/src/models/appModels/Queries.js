const mongoose = require('mongoose');
const NoteSchema = new mongoose.Schema({
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const QuerySchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  notes: [NoteSchema],

  customerName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Closed'],
    default: 'Open',
  },
  resolution: {
    type: String,
    default: '',
  },

  // name: {
  //   type: String,
  //   required: true,
  // },
  // phone: String,
  // country: String,
  // address: String,
  // email: String,
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

QuerySchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Queries', QuerySchema);
