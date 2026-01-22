const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP
router.post('/request-otp', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        // Find worker by phone
        const workerResult = await pool.query(
            'SELECT id, name, phone FROM workers WHERE phone = $1',
            [phone]
        );

        if (workerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found with this phone number' });
        }

        // Generate OTP and set expiry (5 minutes)
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await pool.query(
            'UPDATE workers SET otp = $1, otp_expires_at = $2 WHERE phone = $3',
            [otp, expiresAt, phone]
        );

        // In production, send OTP via SMS service
        // For development, log OTP to console
        console.log(`📱 OTP for ${phone}: ${otp}`);

        res.json({
            message: 'OTP sent successfully',
            // Remove this in production - only for testing
            otp_for_testing: process.env.NODE_ENV !== 'production' ? otp : undefined
        });
    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone and OTP are required' });
        }

        // Find worker and verify OTP
        const workerResult = await pool.query(
            'SELECT id, unique_id, name, phone, otp, otp_expires_at FROM workers WHERE phone = $1',
            [phone]
        );

        if (workerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        const worker = workerResult.rows[0];

        // Check OTP validity
        if (worker.otp !== otp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        if (new Date() > new Date(worker.otp_expires_at)) {
            return res.status(401).json({ error: 'OTP has expired' });
        }

        // Clear OTP after successful verification
        await pool.query(
            'UPDATE workers SET otp = NULL, otp_expires_at = NULL WHERE id = $1',
            [worker.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            {
                id: worker.id,
                uniqueId: worker.unique_id,
                name: worker.name,
                type: 'worker'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            worker: {
                id: worker.id,
                uniqueId: worker.unique_id,
                name: worker.name,
                phone: worker.phone
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current worker (from token)
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        if (decoded.type !== 'worker') {
            return res.status(403).json({ error: 'Invalid token type' });
        }

        const workerResult = await pool.query(
            'SELECT id, unique_id, name, age, gender, origin_state, phone, current_district, latitude, longitude FROM workers WHERE id = $1',
            [decoded.id]
        );

        if (workerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json({ worker: workerResult.rows[0] });
    } catch (error) {
        console.error('Get worker error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
