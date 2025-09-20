require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/idurar_db';
mongoose.connect(mongoUri);

const Client = require('../models/appModels/Client');
const Query = require('../models/appModels/Query');
const Admin = require('../models/coreModels/Admin');

async function addMockData() {
  try {
    console.log('🚀 Starting to add mock data...');

    // Get the first admin user
    const admin = await Admin.findOne();
    if (!admin) {
      console.log('❌ No admin user found. Please run setup first.');
      process.exit(1);
    }

    // Clear existing mock data
    await Client.deleteMany({ name: { $regex: /^Mock/ } });
    await Query.deleteMany({ description: { $regex: /^Mock/ } });
    console.log('🧹 Cleared existing mock data');

    // Add mock clients
    const mockClients = [
      {
        name: 'Mock Customer 1',
        email: 'customer1@mock.com',
        phone: '+1-555-0101',
        country: 'United States',
        address: '123 Main St, New York, NY 10001',
        createdBy: admin._id,
        enabled: true,
      },
      {
        name: 'Mock Customer 2',
        email: 'customer2@mock.com',
        phone: '+1-555-0102',
        country: 'Canada',
        address: '456 Queen St, Toronto, ON M5H 2M9',
        createdBy: admin._id,
        enabled: true,
      },
      {
        name: 'Mock Customer 3',
        email: 'customer3@mock.com',
        phone: '+1-555-0103',
        country: 'United Kingdom',
        address: '789 Oxford St, London W1C 1JN',
        createdBy: admin._id,
        enabled: true,
      },
      {
        name: 'Mock Customer 4',
        email: 'customer4@mock.com',
        phone: '+1-555-0104',
        country: 'Australia',
        address: '321 Collins St, Melbourne VIC 3000',
        createdBy: admin._id,
        enabled: true,
      },
      {
        name: 'Mock Customer 5',
        email: 'customer5@mock.com',
        phone: '+1-555-0105',
        country: 'Germany',
        address: '654 Unter den Linden, 10117 Berlin',
        createdBy: admin._id,
        enabled: true,
      },
    ];

    const createdClients = await Client.insertMany(mockClients);
    console.log(`✅ Created ${createdClients.length} mock clients`);

    // Add mock queries
    const mockQueries = [
      {
        customerId: createdClients[0]._id,
        description: 'Mock Query 1: Product inquiry about pricing and availability',
        status: 'Open',
        resolution: '',
        notes: [
          { text: 'Initial customer inquiry received' },
          { text: 'Waiting for pricing information from sales team' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        customerId: createdClients[1]._id,
        description: 'Mock Query 2: Technical support request for software installation',
        status: 'InProgress',
        resolution: '',
        notes: [
          { text: 'Customer reported installation issues' },
          { text: 'Provided troubleshooting steps' },
          { text: 'Scheduled follow-up call for tomorrow' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        customerId: createdClients[2]._id,
        description: 'Mock Query 3: Billing inquiry about invoice discrepancies',
        status: 'Closed',
        resolution: 'Invoice corrected and credit applied to account',
        notes: [
          { text: 'Customer reported billing discrepancy' },
          { text: 'Reviewed invoice details' },
          { text: 'Found calculation error in tax amount' },
          { text: 'Issued credit memo and corrected invoice' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        customerId: createdClients[3]._id,
        description: 'Mock Query 4: Feature request for mobile app improvements',
        status: 'Open',
        resolution: '',
        notes: [
          { text: 'Customer requested dark mode feature' },
          { text: 'Forwarded to product development team' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        customerId: createdClients[4]._id,
        description: 'Mock Query 5: Account access issues and password reset',
        status: 'InProgress',
        resolution: '',
        notes: [
          { text: 'Customer unable to access account' },
          { text: 'Verified identity through security questions' },
          { text: 'Reset password and sent new credentials' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        customerId: createdClients[0]._id,
        description: 'Mock Query 6: Refund request for cancelled order',
        status: 'Closed',
        resolution: 'Refund processed and credited to original payment method',
        notes: [
          { text: 'Customer requested refund for cancelled order' },
          { text: 'Verified order cancellation' },
          { text: 'Processed refund through payment gateway' },
          { text: 'Sent confirmation email to customer' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        customerId: createdClients[1]._id,
        description: 'Mock Query 7: Integration support for API implementation',
        status: 'Open',
        resolution: '',
        notes: [
          { text: 'Customer needs help with API integration' },
          { text: 'Provided API documentation and examples' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        customerId: createdClients[2]._id,
        description: 'Mock Query 8: Training request for new team members',
        status: 'InProgress',
        resolution: '',
        notes: [
          { text: 'Customer requested training for new team' },
          { text: 'Scheduled training session for next week' },
          { text: 'Prepared training materials and agenda' }
        ],
        createdBy: admin._id,
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ];

    const createdQueries = await Query.insertMany(mockQueries);
    console.log(`✅ Created ${createdQueries.length} mock queries`);

    console.log('🎉 Mock data added successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${createdClients.length} mock clients created`);
    console.log(`- ${createdQueries.length} mock queries created`);
    console.log('\n🔍 You can now test CRUD operations with this mock data.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding mock data:', error);
    process.exit(1);
  }
}

addMockData();
