const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// Create MySQL Connection Pool for high-performance concurrent handling
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'campus_booking_db',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
 // port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,

ssl: {
    ca: fs.readFileSync(
        path.join(__dirname, '../../certs/isrgrootx1.pem')
    ),
    rejectUnauthorized: true
},

//waitForConnections: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper function to test DB connection on server initialization
const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected Successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
  }
};

module.exports = {
  pool,
  testDbConnection,
};
