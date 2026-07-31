const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../config/jwt');

class AuthService {
  /**
   * Register a new Student or Faculty User
   */
  static async registerUser({ fullName, email, password, roleName, department, rollOrEmpId }) {
    // 1. Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      const error = new Error('User with this email already exists.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Fetch role_id from role table
    const [roles] = await pool.query('SELECT id, name FROM roles WHERE name = ?', [roleName.toUpperCase()]);
    if (roles.length === 0) {
      const error = new Error(`Role [${roleName}] does not exist.`);
      error.statusCode = 400;
      throw error;
    }
    const role = roles[0];

    // 3. Hash Password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insert user into DB
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id, department, roll_or_emp_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, role.id, department || 'General', rollOrEmpId || null]
    );

    const userId = result.insertId;

    // 5. Generate JWT Token
    const token = generateToken({
      id: userId,
      email,
      full_name: fullName,
      role_id: role.id,
      role_name: role.name,
    });

    return {
      token,
      user: {
        id: userId,
        full_name: fullName,
        email,
        role: role.name,
        department,
        roll_or_emp_id: rollOrEmpId,
      },
    };
  }

  /**
   * Authenticate User with Email & Password
   */
  static async loginUser({ email, password }) {
    // 1. Fetch user joined with role table
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.department, u.roll_or_emp_id, u.role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const user = users[0];

    // 2. Compare password hashes
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // 3. Generate JWT Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role_id: user.role_id,
      role_name: user.role_name,
    });

    return {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role_name,
        department: user.department,
        roll_or_emp_id: user.roll_or_emp_id,
      },
    };
  }

  /**
   * Get User Profile by ID
   */
  static async getUserProfile(userId) {
    const [users] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.department, u.roll_or_emp_id, u.created_at, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    return users[0];
  }
}

module.exports = AuthService;
