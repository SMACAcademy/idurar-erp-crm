const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
module.exports=mongoose.model('Note', NoteSchema);

const QuerySchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Open', 'InProgress', 'Closed'], 
    default: 'Open'
  },
  resolution: {
    type: String,
    maxLength: 100
  },
  notes: [NoteSchema],
}, { timestamps: true });

module.exports = mongoose.model('Query', QuerySchema);



