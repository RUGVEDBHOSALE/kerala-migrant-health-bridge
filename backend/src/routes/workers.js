const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, doctorOnly } = require('../middleware/auth');

const router = express.Router();

// Fetch worker by Unique ID
router.get('/:uniqueId', authenticateToken, async (req, res) => {
    try {
        const { uniqueId } = req.params;

        const result = await pool.query(
            'SELECT * FROM workers WHERE unique_id = $1',
            [uniqueId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json({ worker: result.rows[0] });
    } catch (error) {
        console.error('Fetch worker error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fetch worker's medical history
router.get('/:uniqueId/history', authenticateToken, async (req, res) => {
    try {
        const { uniqueId } = req.params;

        // First get worker
        const workerResult = await pool.query(
            'SELECT id, unique_id, name FROM workers WHERE unique_id = $1',
            [uniqueId]
        );

        if (workerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        const worker = workerResult.rows[0];

        // Get prescriptions with doctor info
        const prescriptionsResult = await pool.query(
            `SELECT p.*, u.name as doctor_name 
       FROM prescriptions p
       LEFT JOIN users u ON p.doctor_id = u.id
       WHERE p.worker_id = $1
       ORDER BY p.created_at DESC`,
            [worker.id]
        );

        res.json({
            worker,
            history: prescriptionsResult.rows
        });
    } catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new worker (for demo/testing)
router.post('/', authenticateToken, doctorOnly, async (req, res) => {
    try {
        const {
            uniqueId, name, age, gender, originState,
            phone, currentDistrict, latitude, longitude
        } = req.body;

        if (!uniqueId || !name) {
            return res.status(400).json({ error: 'Unique ID and name are required' });
        }

        const result = await pool.query(
            `INSERT INTO workers (unique_id, name, age, gender, origin_state, phone, current_district, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [uniqueId, name, age, gender, originState, phone, currentDistrict, latitude, longitude]
        );

        res.status(201).json({ worker: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Worker with this ID already exists' });
        }
        console.error('Create worker error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// List all workers (for government)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { district, limit = 50, offset = 0 } = req.query;

        let query = 'SELECT * FROM workers';
        const params = [];

        if (district) {
            query += ' WHERE current_district = $1';
            params.push(district);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        res.json({ workers: result.rows });
    } catch (error) {
        console.error('List workers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
