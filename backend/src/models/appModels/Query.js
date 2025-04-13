const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    resolution: {
      type: String,
    },
    notes: [
      {
        content: {
          type: String,
          required: true,
        },
        createdDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Query', QuerySchema);
