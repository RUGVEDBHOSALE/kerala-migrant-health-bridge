const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool, initDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/workers');
const caseRoutes = require('./routes/cases');
const medicineRoutes = require('./routes/medicine');
const uploadRoutes = require('./routes/uploads');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
const uploadsDir = path.join(__dirname, '../uploads/voice-notes');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Attach io to request for real-time updates
app.use((req, res, next) => {
    req.io = io;
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });

    // Join room based on role
    socket.on('joinRoom', (role) => {
        socket.join(role);
        console.log(`Socket ${socket.id} joined room: ${role}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Seed demo data
const seedDemoData = async () => {
    try {
        // Check if demo data already exists
        const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(existingUsers.rows[0].count) > 0) {
            console.log('📦 Demo data already exists');
            return;
        }

        console.log('🌱 Seeding demo data...');

        // Create demo users
        const doctorPassword = await bcrypt.hash('doctor123', 10);
        const govPassword = await bcrypt.hash('gov123', 10);

        await pool.query(`
      INSERT INTO users (email, password_hash, name, role, hospital_name, hospital_id) VALUES
      ('doctor@hospital.kerala.gov.in', $1, 'Dr. Arun Kumar', 'doctor', 'General Hospital Ernakulam', 'GHE001'),
      ('doctor2@hospital.kerala.gov.in', $1, 'Dr. Priya Menon', 'doctor', 'District Hospital Thiruvananthapuram', 'DHT001'),
      ('health.officer@kerala.gov.in', $2, 'Health Commissioner', 'government', NULL, NULL)
    `, [doctorPassword, govPassword]);

        // Create demo workers
        await pool.query(`
      INSERT INTO workers (unique_id, name, age, gender, origin_state, phone, current_district, latitude, longitude) VALUES
      ('MHB-2024-001', 'Ramesh Kumar', 32, 'Male', 'Bihar', '9876543210', 'Ernakulam', 9.9312, 76.2673),
      ('MHB-2024-002', 'Suresh Yadav', 28, 'Male', 'Uttar Pradesh', '9876543211', 'Thiruvananthapuram', 8.5241, 76.9366),
      ('MHB-2024-003', 'Priya Devi', 25, 'Female', 'Jharkhand', '9876543212', 'Kozhikode', 11.2588, 75.7804),
      ('MHB-2024-004', 'Mohan Singh', 35, 'Male', 'Bihar', '9876543213', 'Thrissur', 10.5276, 76.2144),
      ('MHB-2024-005', 'Lakshmi Kumari', 29, 'Female', 'West Bengal', '9876543214', 'Kollam', 8.8932, 76.6141),
      ('MHB-2024-006', 'Anil Sharma', 40, 'Male', 'Rajasthan', '9876543215', 'Palakkad', 10.7867, 76.6548),
      ('MHB-2024-007', 'Sunita Das', 27, 'Female', 'Odisha', '9876543216', 'Malappuram', 11.0510, 76.0711),
      ('MHB-2024-008', 'Vijay Patel', 33, 'Male', 'Gujarat', '9876543217', 'Kannur', 11.8745, 75.3704)
    `);

        // Get user and worker IDs for prescriptions
        const doctors = await pool.query("SELECT id FROM users WHERE role = 'doctor'");
        const workers = await pool.query('SELECT id, current_district, latitude, longitude FROM workers');

        // Create demo prescriptions (last 30 days)
        const diagnoses = ['Dengue Fever', 'Malaria', 'Typhoid', 'Respiratory Infection', 'Gastroenteritis', 'Skin Infection'];
        const medications = [
            [{ name: 'Paracetamol', dosage: '500mg', frequency: 'TDS' }],
            [{ name: 'Artemether', dosage: '80mg', frequency: 'BD' }],
            [{ name: 'Ciprofloxacin', dosage: '500mg', frequency: 'BD' }],
            [{ name: 'Amoxicillin', dosage: '500mg', frequency: 'TDS' }],
            [{ name: 'ORS', dosage: '1 sachet', frequency: 'QID' }],
            [{ name: 'Clotrimazole', dosage: 'Apply twice', frequency: 'BD' }]
        ];

        for (let i = 0; i < 50; i++) {
            const doctor = doctors.rows[Math.floor(Math.random() * doctors.rows.length)];
            const worker = workers.rows[Math.floor(Math.random() * workers.rows.length)];
            const diagnosisIndex = Math.floor(Math.random() * diagnoses.length);
            const daysAgo = Math.floor(Math.random() * 30);

            await pool.query(`
        INSERT INTO prescriptions (worker_id, doctor_id, diagnosis, medications, hospital_name, district, latitude, longitude, created_at)
        VALUES ($1, $2, $3, $4, 'Demo Hospital', $5, $6, $7, NOW() - INTERVAL '${daysAgo} days')
      `, [
                worker.id,
                doctor.id,
                diagnoses[diagnosisIndex],
                JSON.stringify(medications[diagnosisIndex]),
                worker.current_district,
                worker.latitude,
                worker.longitude
            ]);
        }

        // Create demo medicine requests
        await pool.query(`
      INSERT INTO medicine_requests (doctor_id, hospital_name, district, medicines, status) VALUES
      ($1, 'General Hospital Ernakulam', 'Ernakulam', $2, 'pending'),
      ($1, 'General Hospital Ernakulam', 'Ernakulam', $3, 'approved')
    `, [
            doctors.rows[0].id,
            JSON.stringify([{ name: 'Paracetamol', quantity: 500 }, { name: 'ORS Sachets', quantity: 1000 }]),
            JSON.stringify([{ name: 'Artemether', quantity: 200 }])
        ]);

        console.log('✅ Demo data seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding demo data:', error.message);
    }
};

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Initialize database tables
        await initDB();

        // Seed demo data
        await seedDemoData();

        server.listen(PORT, () => {
            console.log(`
🚀 Kerala Health Bridge API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on port ${PORT}
🔗 API: http://localhost:${PORT}/api
🔌 WebSocket: ws://localhost:${PORT}
📋 Health: http://localhost:${PORT}/api/health

Demo Credentials:
👨‍⚕️ Doctor: doctor@hospital.kerala.gov.in / doctor123
🏛️ Government: health.officer@kerala.gov.in / gov123
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
