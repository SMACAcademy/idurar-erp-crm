const mongoose = require('mongoose');
const path = require('path');

const registerModels = () => {
  console.log('Starting model registration...');

  try {
    // Register core models first
    console.log('Registering core models...');

    // Load Admin model first
    console.log('Loading Admin model...');
    require('./coreModels/Admin');
    console.log('Admin model registered:', !!mongoose.models.Admin);

    // Load other core models
    require('./coreModels/Setting');
    require('./coreModels/Customer');
    require('./coreModels/AdminPassword');
    require('./coreModels/Upload');

    // Register app models
    console.log('Registering app models...');
    require('./appModels/Query');
    require('./appModels/Taxes');
    require('./appModels/Payment');
    require('./appModels/PaymentMode');
    require('./appModels/Quote');
    require('./appModels/Client');
    require('./appModels/Invoice');

    // Verify models are registered
    const registeredModels = Object.keys(mongoose.models);
    console.log('Registered models:', registeredModels);

    // Verify required models
    const requiredModels = [
      'Setting',
      'Admin',
      'Customer',
      'Query',
      'Taxes',
      'Payment',
      'PaymentMode',
      'Quote',
      'Client',
      'Invoice',
    ];

    const missingModels = requiredModels.filter((model) => !mongoose.models[model]);

    if (missingModels.length > 0) {
      console.error('Missing required models:', missingModels);
      process.exit(1);
    }

    console.log('Model registration completed successfully');
  } catch (error) {
    console.error('Error during model registration:', error);
    process.exit(1);
  }
};

module.exports = registerModels;
