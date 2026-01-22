const express = require('express');
const { pool } = require('../config/database');
const { authenticateWorker } = require('../middleware/workerAuth');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create emergency request (for workers)
router.post('/', authenticateWorker, async (req, res) => {
    try {
        const { type, description, latitude, longitude } = req.body;

        if (!type) {
            return res.status(400).json({ error: 'Emergency type is required' });
        }

        const result = await pool.query(
            `INSERT INTO emergency_requests (worker_id, type, description, latitude, longitude)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [req.worker.id, type, description, latitude, longitude]
        );

        // Emit real-time notification to government/doctors
        if (req.io) {
            req.io.to('government').emit('newEmergency', result.rows[0]);
            req.io.to('doctor').emit('newEmergency', result.rows[0]);
        }

        res.status(201).json({
            message: 'Emergency request created',
            emergency: result.rows[0]
        });
    } catch (error) {
        console.error('Create emergency error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get worker's own emergency requests
router.get('/my-requests', authenticateWorker, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM emergency_requests 
             WHERE worker_id = $1 
             ORDER BY created_at DESC`,
            [req.worker.id]
        );

        res.json({ emergencies: result.rows });
    } catch (error) {
        console.error('Get my emergencies error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// List all emergency requests (for government/doctors)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        let query = `
            SELECT e.*, w.name as worker_name, w.phone as worker_phone, w.unique_id as worker_unique_id
            FROM emergency_requests e
            LEFT JOIN workers w ON e.worker_id = w.id
        `;
        const params = [];

        if (status) {
            query += ' WHERE e.status = $1';
            params.push(status);
        }

        query += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);
        res.json({ emergencies: result.rows });
    } catch (error) {
        console.error('List emergencies error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update emergency request status (for government/doctors)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'in_progress', 'resolved', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: 'Valid status required: pending, in_progress, resolved, cancelled'
            });
        }

        const result = await pool.query(
            `UPDATE emergency_requests SET status = $1 WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Emergency request not found' });
        }

        // Emit status update
        if (req.io) {
            req.io.emit('emergencyUpdated', result.rows[0]);
        }

        res.json({ emergency: result.rows[0] });
    } catch (error) {
        console.error('Update emergency error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
