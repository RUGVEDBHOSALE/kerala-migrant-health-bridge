const express = require('express');
const { pool } = require('../config/database');
const { authenticateWorker } = require('../middleware/workerAuth');

const router = express.Router();

// Get worker's full profile
router.get('/profile', authenticateWorker, async (req, res) => {
    try {
        const workerResult = await pool.query(
            `SELECT id, unique_id, name, age, gender, origin_state, phone, 
                    current_district, latitude, longitude, created_at 
             FROM workers WHERE id = $1`,
            [req.worker.id]
        );

        if (workerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json({ worker: workerResult.rows[0] });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update worker's profile
router.put('/profile', authenticateWorker, async (req, res) => {
    try {
        const { phone, currentDistrict, latitude, longitude } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (phone) {
            updates.push(`phone = $${paramCount++}`);
            values.push(phone);
        }
        if (currentDistrict) {
            updates.push(`current_district = $${paramCount++}`);
            values.push(currentDistrict);
        }
        if (latitude !== undefined) {
            updates.push(`latitude = $${paramCount++}`);
            values.push(latitude);
        }
        if (longitude !== undefined) {
            updates.push(`longitude = $${paramCount++}`);
            values.push(longitude);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(req.worker.id);
        const query = `UPDATE workers SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

        const result = await pool.query(query, values);
        res.json({ worker: result.rows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get worker's prescription history
router.get('/prescriptions', authenticateWorker, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, u.name as doctor_name, u.hospital_name
             FROM prescriptions p
             LEFT JOIN users u ON p.doctor_id = u.id
             WHERE p.worker_id = $1
             ORDER BY p.created_at DESC`,
            [req.worker.id]
        );

        res.json({ prescriptions: result.rows });
    } catch (error) {
        console.error('Get prescriptions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get specific prescription details
router.get('/prescriptions/:id', authenticateWorker, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, u.name as doctor_name, u.hospital_name
             FROM prescriptions p
             LEFT JOIN users u ON p.doctor_id = u.id
             WHERE p.id = $1 AND p.worker_id = $2`,
            [req.params.id, req.worker.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prescription not found' });
        }

        res.json({ prescription: result.rows[0] });
    } catch (error) {
        console.error('Get prescription error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get notifications for worker (including health camp broadcasts)
router.get('/notifications', authenticateWorker, async (req, res) => {
    try {
        // Get broadcast notifications
        const notificationsResult = await pool.query(
            `SELECT id, title, message, type, reference_id, created_at 
             FROM notifications 
             WHERE is_broadcast = true
             ORDER BY created_at DESC
             LIMIT 50`
        );

        // Get upcoming health camps
        const campsResult = await pool.query(
            `SELECT id, camp_name, camp_type, location_name, 
                    latitude, longitude, maps_link, scheduled_date, description
             FROM health_camps 
             WHERE scheduled_date >= NOW() AND status = 'scheduled'
             ORDER BY scheduled_date ASC
             LIMIT 10`
        );

        // Format notifications with health camps as special type
        const notifications = notificationsResult.rows.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            referenceId: n.reference_id,
            createdAt: n.created_at,
            isRead: false
        }));

        const camps = campsResult.rows.map(c => ({
            id: c.id,
            campName: c.camp_name,
            campType: c.camp_type,
            locationName: c.location_name,
            latitude: parseFloat(c.latitude) || null,
            longitude: parseFloat(c.longitude) || null,
            mapsLink: c.maps_link,
            scheduledDate: c.scheduled_date,
            description: c.description
        }));

        res.json({
            notifications,
            upcomingCamps: camps,
            unreadCount: notifications.length
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
