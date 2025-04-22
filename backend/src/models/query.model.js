const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const querySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'in-progress'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    resolution: {
      type: String,
      maxlength: 100,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'customer',
      required: true,
    },
    notes: [noteSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'admin',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('query', querySchema);
