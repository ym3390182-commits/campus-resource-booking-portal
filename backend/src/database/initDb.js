const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const initDatabase = async () => {
  console.log('🔄 Initializing Campus Booking Database...');

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

  let connection;

  try {
    // Connect to MySQL server (without specifying DB_NAME yet)
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true, // Required to execute entire schema.sql file at once
    });

    console.log('✅ Connected to MySQL server.');

    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema script
    console.log('📄 Executing database schema and seed data...');
    await connection.query(sqlScript);

    console.log('===================================================');
    console.log('🎉 SUCCESS: Database `campus_booking_db` created & seeded!');
    console.log('===================================================');
  } catch (error) {
    console.error('❌ Database Initialization Failed!');
    console.error('Error Details:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('👉 TIP: Please double-check your DB_PASSWORD in backend/.env');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

initDatabase();
