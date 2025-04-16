require('module-alias/register');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/database');
const registerModels = require('./models/registerModels');

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 7 || (major === 7 && minor <= 5)) {
  console.log('Please go to nodejs.org and download version 7.6 or greater. 👌\n ');
  process.exit();
}

// Start the application
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Register models
    registerModels();

    // Start our app!
    const app = require('./app');
    app.set('port', process.env.PORT || 8888);
    const server = app.listen(app.get('port'), () => {
      console.log(`Express running → On PORT : ${server.address().port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
