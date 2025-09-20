const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Client = require('../models/appModels/Client');
const Query = require('../models/appModels/Query');
const Admin = require('../models/coreModels/Admin');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DATABASE || 'mongodb://localhost:27017/idurar-erp-crm');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Client.deleteMany({});
    await Query.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create sample clients
    const clients = await Client.create([
      {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0101',
        country: 'United States',
        address: '123 Business Ave, New York, NY 10001',
        enabled: true,
        removed: false,
      },
      {
        name: 'TechStart Solutions',
        email: 'info@techstart.com',
        phone: '+1-555-0102',
        country: 'Canada',
        address: '456 Innovation St, Toronto, ON M5H 2N2',
        enabled: true,
        removed: false,
      },
      {
        name: 'Global Enterprises Ltd',
        email: 'support@globalent.com',
        phone: '+44-20-7946-0958',
        country: 'United Kingdom',
        address: '789 Corporate Blvd, London SW1A 1AA',
        enabled: true,
        removed: false,
      },
      {
        name: 'Digital Dynamics Inc',
        email: 'hello@digitaldynamics.com',
        phone: '+1-555-0103',
        country: 'United States',
        address: '321 Tech Park, San Francisco, CA 94105',
        enabled: true,
        removed: false,
      },
      {
        name: 'Innovation Hub GmbH',
        email: 'kontakt@innovationhub.de',
        phone: '+49-30-12345678',
        country: 'Germany',
        address: '654 Startup Alley, Berlin 10115',
        enabled: true,
        removed: false,
      },
      {
        name: 'Future Systems Pty Ltd',
        email: 'info@futuresystems.com.au',
        phone: '+61-2-9876-5432',
        country: 'Australia',
        address: '987 Innovation Way, Sydney NSW 2000',
        enabled: true,
        removed: false,
      },
      {
        name: 'Smart Solutions LLC',
        email: 'contact@smartsolutions.com',
        phone: '+1-555-0104',
        country: 'United States',
        address: '147 AI Street, Austin, TX 78701',
        enabled: true,
        removed: false,
      },
      {
        name: 'NextGen Technologies',
        email: 'support@nextgen.tech',
        phone: '+1-555-0105',
        country: 'United States',
        address: '258 Future Lane, Seattle, WA 98101',
        enabled: true,
        removed: false,
      }
    ]);

    console.log(`✅ Created ${clients.length} clients`);

    // Create sample queries
    const queries = await Query.create([
      {
        customerId: clients[0]._id,
        description: 'Need help with invoice processing system integration. Our current system is not compatible with the new API endpoints.',
        status: 'Open',
        resolution: '',
        notes: [
          {
            text: 'Initial query received from Acme Corporation regarding invoice system integration.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ],
        createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[1]._id,
        description: 'Payment gateway is not processing transactions correctly. Getting timeout errors for credit card payments.',
        status: 'InProgress',
        resolution: 'Identified the issue with SSL certificate configuration. Working on fix.',
        notes: [
          {
            text: 'Customer reported payment gateway issues with timeout errors.',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
          },
          {
            text: 'Investigated and found SSL certificate configuration problem.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          },
          {
            text: 'Working on implementing the fix for SSL configuration.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          }
        ],
        createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[2]._id,
        description: 'User authentication system needs to be updated to support multi-factor authentication.',
        status: 'Closed',
        resolution: 'Successfully implemented MFA using TOTP. All users have been migrated and trained.',
        notes: [
          {
            text: 'Customer requested MFA implementation for enhanced security.',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
          },
          {
            text: 'Implemented TOTP-based MFA system.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          },
          {
            text: 'Completed user migration and training sessions.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            text: 'Project completed successfully. Customer satisfied with implementation.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          }
        ],
        createdDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[3]._id,
        description: 'Database performance issues causing slow response times. Need optimization.',
        status: 'Open',
        resolution: '',
        notes: [
          {
            text: 'Customer experiencing slow database queries affecting application performance.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          }
        ],
        createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[4]._id,
        description: 'Need assistance with API documentation and integration examples.',
        status: 'InProgress',
        resolution: 'Creating comprehensive API documentation with code examples.',
        notes: [
          {
            text: 'Customer needs help with API integration and documentation.',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
          },
          {
            text: 'Started working on comprehensive API documentation.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ],
        createdDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[5]._id,
        description: 'Mobile app crashes on iOS devices when processing large files.',
        status: 'Open',
        resolution: '',
        notes: [
          {
            text: 'iOS app crashes reported when handling large file uploads.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          }
        ],
        createdDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[6]._id,
        description: 'Email notifications are not being sent to users. SMTP configuration issue.',
        status: 'Closed',
        resolution: 'Fixed SMTP server configuration and updated email templates. All notifications working properly.',
        notes: [
          {
            text: 'Customer reported email notification system not working.',
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
          },
          {
            text: 'Identified SMTP server configuration problem.',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
          },
          {
            text: 'Fixed SMTP configuration and updated email templates.',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
          },
          {
            text: 'Tested email notifications - all working correctly now.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          }
        ],
        createdDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        removed: false,
      },
      {
        customerId: clients[7]._id,
        description: 'Need to implement real-time chat functionality in the web application.',
        status: 'InProgress',
        resolution: 'Implementing WebSocket-based chat system with message history.',
        notes: [
          {
            text: 'Customer wants to add real-time chat to their web application.',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
          },
          {
            text: 'Started implementing WebSocket-based chat system.',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
          },
          {
            text: 'Working on message history and user presence features.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          }
        ],
        createdDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        removed: false,
      }
    ]);

    console.log(`✅ Created ${queries.length} queries`);

    // Create a default admin user if none exists
    const existingAdmin = await Admin.findOne();
    if (!existingAdmin) {
      await Admin.create({
        email: 'admin@idurar.com',
        name: 'System Administrator',
        surname: 'User',
        enabled: true,
        role: 'owner',
        removed: false,
      });
      console.log('✅ Created default admin user (admin@idurar.com)');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${clients.length} clients created`);
    console.log(`   • ${queries.length} queries created`);
    console.log(`   • Admin user: admin@idurar.com`);
    console.log('\n🚀 You can now test the Query Management Module!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding function
seedData();
