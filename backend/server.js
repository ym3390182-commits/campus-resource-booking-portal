const app = require('./src/app');
const { testDbConnection } = require('./src/config/database');
const seedDefaultUsers = require('./src/database/seedAdmin');

const PORT = process.env.PORT || 5000;

// Initialize Server & Database Connection
app.listen(PORT, async () => {
  console.log(`===================================================`);
  console.log(`🚀 Campus Booking Server running on Port: ${PORT}`);
  console.log(`🌐 Base API URL: http://localhost:${PORT}/api/v1`);
  console.log(`===================================================`);
  
  // Test MySQL Connection on Startup
  await testDbConnection();

  // Seed default test accounts (Admin, Faculty, Student) if missing
  await seedDefaultUsers();
});
