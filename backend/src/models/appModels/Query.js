const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');

const NoteSchema = new mongoose.Schema({
    text: { type: String },
    createdAt: { type: Date, default: Date.now },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const QuerySchema = new mongoose.Schema({
    removed: {
        type: Boolean,
        default: false
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        autopopulate: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Open', 'InProgress', 'Closed'],
        default: 'Open'
    },
    resolution: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    notes: [NoteSchema]
});

QuerySchema.plugin(autopopulate); 
module.exports = mongoose.model('Query', QuerySchema);
