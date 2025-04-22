const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  settingCategory: {
    type: String,
    required: true,
    lowercase: true,
  },
  settingKey: {
    type: String,
    lowercase: true,
    required: true,
  },
  settingValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  valueType: {
    type: String,
    default: 'String',
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  isCoreSetting: {
    type: Boolean,
    default: false,
  },
});

// Create the model
const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
