const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Client = require('../models/appModels/Client');
const Query = require('../models/appModels/Query');

const resetData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE || 'mongodb://localhost:27017/idurar-erp-crm');
    console.log('✅ Connected to MongoDB');

    // Clear all data
    await Client.deleteMany({});
    await Query.deleteMany({});
    
    console.log('🗑️ All data cleared successfully!');
    console.log('💡 Run "node src/scripts/seedData.js" to add sample data again.');

  } catch (error) {
    console.error('❌ Error resetting data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the function
resetData();
