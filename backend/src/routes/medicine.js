const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, doctorOnly, governmentOnly } = require('../middleware/auth');

const router = express.Router();

// Submit medicine requisition request
router.post('/request', authenticateToken, doctorOnly, async (req, res) => {
    try {
        const { medicines, district } = req.body;

        if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({ error: 'Medicines list is required' });
        }

        const result = await pool.query(
            `INSERT INTO medicine_requests (doctor_id, hospital_name, district, medicines, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
            [
                req.user.id,
                req.user.hospitalName || 'Unknown Hospital',
                district || 'Unknown',
                JSON.stringify(medicines)
            ]
        );

        const request = result.rows[0];

        // Emit real-time update
        if (req.io) {
            req.io.emit('newMedicineRequest', {
                id: request.id,
                hospitalName: request.hospital_name,
                district: request.district,
                medicines: medicines,
                status: 'pending',
                createdAt: request.created_at
            });
        }

        res.status(201).json({
            message: 'Medicine request submitted successfully',
            request
        });
    } catch (error) {
        console.error('Medicine request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all medicine requests (for government)
router.get('/requests', authenticateToken, async (req, res) => {
    try {
        const { status, district, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT mr.*, u.name as doctor_name, u.email as doctor_email
      FROM medicine_requests mr
      LEFT JOIN users u ON mr.doctor_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND mr.status = $${params.length}`;
        }

        if (district) {
            params.push(district);
            query += ` AND mr.district = $${params.length}`;
        }

        query += ` ORDER BY mr.created_at DESC`;

        params.push(limit);
        query += ` LIMIT $${params.length}`;

        params.push(offset);
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        // Get summary stats
        const statsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM medicine_requests
      GROUP BY status
    `);

        res.json({
            requests: result.rows,
            stats: statsResult.rows.reduce((acc, row) => {
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Get medicine requests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update medicine request status (for government)
router.patch('/request/:id', authenticateToken, governmentOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'fulfilled', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await pool.query(
            `UPDATE medicine_requests 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Emit real-time update
        if (req.io) {
            req.io.emit('medicineRequestUpdate', {
                id,
                status,
                updatedAt: new Date()
            });
        }

        res.json({
            message: 'Request updated successfully',
            request: result.rows[0]
        });
    } catch (error) {
        console.error('Update medicine request error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get medicine demand summary by district
router.get('/demand', authenticateToken, governmentOnly, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT 
        district,
        COUNT(*) as request_count,
        medicines
      FROM medicine_requests
      WHERE status IN ('pending', 'approved')
      GROUP BY district, medicines
      ORDER BY request_count DESC
    `);

        // Aggregate medicine demands
        const demandByDistrict = {};
        result.rows.forEach(row => {
            if (!demandByDistrict[row.district]) {
                demandByDistrict[row.district] = {
                    district: row.district,
                    totalRequests: 0,
                    medicines: {}
                };
            }
            demandByDistrict[row.district].totalRequests += parseInt(row.request_count);

            const medicines = typeof row.medicines === 'string'
                ? JSON.parse(row.medicines)
                : row.medicines;

            medicines.forEach(med => {
                const medName = med.name || med;
                if (!demandByDistrict[row.district].medicines[medName]) {
                    demandByDistrict[row.district].medicines[medName] = 0;
                }
                demandByDistrict[row.district].medicines[medName] += med.quantity || 1;
            });
        });

        res.json({ demand: Object.values(demandByDistrict) });
    } catch (error) {
        console.error('Get medicine demand error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
