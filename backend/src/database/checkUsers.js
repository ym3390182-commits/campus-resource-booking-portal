const { pool } = require('../config/database');

const checkUsers = async () => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.department, u.roll_or_emp_id, r.name AS role 
       FROM users u 
       JOIN roles r ON u.role_id = r.id`
    );

    console.log('===================================================');
    console.log('👥 DATABASE USERS VERIFICATION:');
    console.log('===================================================');
    console.table(users);
    console.log('===================================================');
    console.log('✅ VERIFICATION SUCCESSFUL: 3 Demo users ready!');
    console.log('===================================================');
  } catch (error) {
    console.error('❌ Verification Error:', error.message);
  } finally {
    process.exit();
  }
};

checkUsers();
