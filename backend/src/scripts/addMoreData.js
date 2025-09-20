const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Client = require('../models/appModels/Client');
const Query = require('../models/appModels/Query');

const addMoreData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE || 'mongodb://localhost:27017/idurar-erp-crm');
    console.log('✅ Connected to MongoDB');

    // Get existing clients
    const clients = await Client.find({ removed: false });
    console.log(`📋 Found ${clients.length} existing clients`);

    if (clients.length === 0) {
      console.log('❌ No clients found. Please run seedData.js first.');
      return;
    }

    // Create additional sample queries
    const additionalQueries = await Query.create([
      {
        customerId: clients[Math.floor(Math.random() * clients.length)]._id,
        description: 'Need help with data migration from legacy system to new platform.',
        status: 'Open',
        resolution: '',
        notes: [
          {
            text: 'Customer needs assistance with migrating data from their old system.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[Math.floor(Math.random() * clients.length)]._id,
        description: 'Website loading speed is very slow. Need performance optimization.',
        status: 'InProgress',
        resolution: 'Analyzing performance bottlenecks and implementing caching strategies.',
        notes: [
          {
            text: 'Customer reported slow website loading times.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            text: 'Started performance analysis and optimization.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[Math.floor(Math.random() * clients.length)]._id,
        description: 'Need to implement automated backup system for database.',
        status: 'Open',
        resolution: '',
        notes: [
          {
            text: 'Customer wants to set up automated database backups.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[Math.floor(Math.random() * clients.length)]._id,
        description: 'User interface needs to be updated to be more mobile-friendly.',
        status: 'Closed',
        resolution: 'Successfully redesigned UI with responsive design. All mobile devices now supported.',
        notes: [
          {
            text: 'Customer requested mobile-friendly UI updates.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            text: 'Started UI redesign with responsive design principles.',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          },
          {
            text: 'Completed responsive design implementation.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            text: 'Testing completed on various mobile devices. All working perfectly.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[Math.floor(Math.random() * clients.length)]._id,
        description: 'Security audit required for the application. Need vulnerability assessment.',
        status: 'InProgress',
        resolution: 'Conducting comprehensive security audit and implementing recommended fixes.',
        notes: [
          {
            text: 'Customer requested security audit for their application.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            text: 'Started comprehensive security assessment.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            text: 'Found several security issues. Working on fixes.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        removed: false,
      }
    ]);

    console.log(`✅ Created ${additionalQueries.length} additional queries`);

    // Get total counts
    const totalClients = await Client.countDocuments({ removed: false });
    const totalQueries = await Query.countDocuments({ removed: false });

    console.log('\n🎉 Additional data added successfully!');
    console.log('\n📊 Updated Summary:');
    console.log(`   • ${totalClients} total clients`);
    console.log(`   • ${totalQueries} total queries`);
    console.log('\n🚀 You now have more data to test with!');

  } catch (error) {
    console.error('❌ Error adding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the function
addMoreData();
