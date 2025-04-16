const mongoose = require('mongoose');

// Import all models
require('./coreModels/Admin');
require('./coreModels/Setting');
require('./query.model');
require('./appModels/Client');

// Export mongoose
module.exports = mongoose;

const Admin = require('./coreModels/Admin');
const Setting = require('./coreModels/Setting');

module.exports = {
  Admin,
  Setting,
};
