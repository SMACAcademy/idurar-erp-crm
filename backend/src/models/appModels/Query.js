const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        content: { type: String, required: true }
    },
    { timestamps: true }
);

const querySchema = new mongoose.Schema(
    {
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true
        },
        description: { type: String, required: true },
        status: {
            type: String,
            enum: ['Open', 'InProgress', 'Closed'],
            default: 'Open'
        },
        resolution: {
            type: String,
            maxlength: 100
        },
        notes: [noteSchema]
    },
    { timestamps: true }
);

module.exports = mongoose.model('Query', querySchema);
