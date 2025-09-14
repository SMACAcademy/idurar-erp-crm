require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/idurar_db';
mongoose.connect(mongoUri);

const Client = require('../models/appModels/Client');
const Query = require('../models/appModels/Query');

async function checkMockData() {
  try {
    console.log('🔍 Checking mock data in database...\n');

    // Check mock clients
    const mockClients = await Client.find({ name: { $regex: /^Mock/ } });
    console.log(`📊 Mock Clients Found: ${mockClients.length}`);
    
    if (mockClients.length > 0) {
      console.log('👥 Mock Clients:');
      mockClients.forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.name} (${client.email}) - ${client.country}`);
      });
    }

    // Check mock queries
    const mockQueries = await Query.find({ description: { $regex: /^Mock/ } });
    console.log(`\n📊 Mock Queries Found: ${mockQueries.length}`);
    
    if (mockQueries.length > 0) {
      console.log('❓ Mock Queries:');
      mockQueries.forEach((query, index) => {
        console.log(`  ${index + 1}. ${query.description}`);
        console.log(`     Status: ${query.status}`);
        console.log(`     Notes: ${query.notes.length} notes`);
        console.log(`     Created: ${query.createdDate.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check total counts
    const totalClients = await Client.countDocuments();
    const totalQueries = await Query.countDocuments();
    
    console.log(`\n📈 Total Counts:`);
    console.log(`  - Total Clients: ${totalClients}`);
    console.log(`  - Total Queries: ${totalQueries}`);
    console.log(`  - Mock Clients: ${mockClients.length}`);
    console.log(`  - Mock Queries: ${mockQueries.length}`);

    if (mockClients.length === 0 && mockQueries.length === 0) {
      console.log('\n⚠️  No mock data found. Run "npm run mock-data" to add mock data.');
    } else {
      console.log('\n✅ Mock data is present and ready for CRUD operations!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking mock data:', error);
    process.exit(1);
  }
}

checkMockData();

