const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Initialize database tables
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('doctor', 'government')),
        name VARCHAR(255) NOT NULL,
        hospital_name VARCHAR(255),
        hospital_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        unique_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        age INTEGER,
        gender VARCHAR(20),
        origin_state VARCHAR(100),
        phone VARCHAR(20),
        current_district VARCHAR(100),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS prescriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID REFERENCES workers(id),
        doctor_id UUID REFERENCES users(id),
        diagnosis VARCHAR(500) NOT NULL,
        medications JSONB NOT NULL,
        voice_note_url VARCHAR(500),
        hospital_name VARCHAR(255),
        district VARCHAR(100),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medicine_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID REFERENCES users(id),
        hospital_name VARCHAR(255),
        district VARCHAR(100),
        medicines JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add OTP columns to workers table for authentication
      ALTER TABLE workers ADD COLUMN IF NOT EXISTS otp VARCHAR(6);
      ALTER TABLE workers ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;

      -- Emergency requests table for worker assistance
      CREATE TABLE IF NOT EXISTS emergency_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id UUID REFERENCES workers(id),
        type VARCHAR(50) NOT NULL,
        description TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Health Camps table for scheduled health events
      CREATE TABLE IF NOT EXISTS health_camps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        camp_name VARCHAR(255) NOT NULL,
        camp_type VARCHAR(50) NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        maps_link VARCHAR(500),
        scheduled_date TIMESTAMP NOT NULL,
        description TEXT,
        created_by UUID REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Broadcast Notifications table for mobile app
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        reference_id UUID,
        is_broadcast BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
};

module.exports = { pool, initDB };
