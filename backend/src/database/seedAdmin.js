const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const seedDefaultUsers = async () => {
  try {
    console.log('🌱 Seeding default test users for Admin, Faculty, and Student...');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    const studentPasswordHash = await bcrypt.hash('student123', salt);
    const facultyPasswordHash = await bcrypt.hash('faculty123', salt);

    // 1. Seed Admin User
    const [existingAdmin] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@campus.edu']);
    if (existingAdmin.length === 0) {
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role_id, department, roll_or_emp_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['System Admin', 'admin@campus.edu', passwordHash, 1, 'Administration', 'EMP-001']
      );
      console.log('✅ Created Admin user: admin@campus.edu / admin123');
    }

    // 2. Seed Faculty User
    const [existingFaculty] = await pool.query('SELECT id FROM users WHERE email = ?', ['faculty@campus.edu']);
    if (existingFaculty.length === 0) {
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role_id, department, roll_or_emp_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Dr. Rajesh Kumar', 'faculty@campus.edu', facultyPasswordHash, 2, 'Computer Science', 'EMP-204']
      );
      console.log('✅ Created Faculty user: faculty@campus.edu / faculty123');
    }

    // 3. Seed Student User
    const [existingStudent] = await pool.query('SELECT id FROM users WHERE email = ?', ['student@campus.edu']);
    if (existingStudent.length === 0) {
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role_id, department, roll_or_emp_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Yash Mittal', 'student@campus.edu', studentPasswordHash, 3, 'Computer Science', '22BCE1004']
      );
      console.log('✅ Created Student user: student@campus.edu / student123');
    }

    console.log('🎉 Default users seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  }
};

module.exports = seedDefaultUsers;
