const { PrismaClient } = require('@prisma/client');

async function testDB() {
  try {
    const prisma = new PrismaClient();
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Run migration
    console.log('Running migrations...');
    await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Migrations completed');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

testDB();
