const mongoose = require('mongoose');

const querySchema = mongoose.Schema({
  customername: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  resolution: {
    type: String,
    maxlength: 100,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'inProgress'],
  },
  notes: [
    {
      description: {
        type: String,
        required: true,
      },
      queryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Queries',
      },
    },
  ],
},{timestamps: true});
module.exports = mongoose.model('Queries', querySchema);
