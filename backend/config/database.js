const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loomio_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Run SQL file helper (tables first, then indexes)
const runSqlFile = async (connection, filePath) => {
  const sql = fs.readFileSync(filePath, 'utf-8');

  const statements = sql
    .split(/;\s*(?:\r?\n|$)/) // handle CRLF and EOF
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const skipPrefixes = [
    'CREATE DATABASE',
    'USE ',
    'CREATE USER',
    'GRANT ',
    'FLUSH PRIVILEGES',
    'EXIT'
  ];

  const ddl = [];
  const indexes = [];

  for (const stmt of statements) {
    const upper = stmt.toUpperCase();
    if (skipPrefixes.some(p => upper.startsWith(p))) continue;
    if (upper.startsWith('CREATE INDEX') || upper.startsWith('ALTER TABLE') && upper.includes('ADD INDEX')) {
      indexes.push(stmt);
    } else {
      ddl.push(stmt);
    }
  }

  // Execute tables/DDL first
  for (const stmt of ddl) {
    await connection.query(stmt);
  }
  // Then indexes
  for (const stmt of indexes) {
    await connection.query(stmt);
  }
};

// Seed default admin if no users exist
const seedDefaultAdmin = async (connection) => {
  const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
  if (users[0].count === 0) {
    const bcrypt = require('bcryptjs');
    const adminName = process.env.ADMIN_NAME || 'Administrator';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@loomio.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await connection.execute(
      'INSERT INTO users (name, email, password_hash, role, is_active, total_points) VALUES (?, ?, ?, ?, 1, 0)',
      [adminName, adminEmail, passwordHash, 'admin']
    );
    console.log(`👑 Default admin created: ${adminEmail}`);
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'loomio_db'}\``);
    await connection.query(`USE \`${process.env.DB_NAME || 'loomio_db'}\``);

    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [process.env.DB_NAME || 'loomio_db']
    );

    if (tables.length === 0) {
      console.log('📦 Initializing database tables from schema.sql ...');
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      await runSqlFile(connection, schemaPath);
      console.log('✅ Schema applied successfully');
      await seedDefaultAdmin(connection);
    }

    connection.release();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};