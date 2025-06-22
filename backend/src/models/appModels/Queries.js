const mongoose = require('mongoose');
const generateName = () => {
  const names = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Ethan',
    'Fiona',
    'George',
    'Hannah',
    'Ivan',
    'Julia',
  ];
  const random = names[Math.floor(Math.random() * 10)];
  return random;
};
const querySchema = mongoose.Schema({
  customername: {
    type: String,

    default: generateName(),
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
    enum: ['open', 'closed', 'running'],
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
});
module.exports = mongoose.model('Queries', querySchema);
