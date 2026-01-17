const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, doctorOnly, governmentOnly } = require('../middleware/auth');

const router = express.Router();

// Submit new case/prescription (triggers real-time update)
router.post('/', authenticateToken, doctorOnly, async (req, res) => {
    try {
        const {
            workerId,
            workerUniqueId,
            diagnosis,
            medications,
            voiceNoteUrl,
            district,
            latitude,
            longitude
        } = req.body;

        if (!diagnosis || !medications) {
            return res.status(400).json({ error: 'Diagnosis and medications are required' });
        }

        // Get worker ID if unique_id provided
        let finalWorkerId = workerId;
        if (!workerId && workerUniqueId) {
            const workerResult = await pool.query(
                'SELECT id FROM workers WHERE unique_id = $1',
                [workerUniqueId]
            );
            if (workerResult.rows.length === 0) {
                return res.status(404).json({ error: 'Worker not found' });
            }
            finalWorkerId = workerResult.rows[0].id;
        }

        const result = await pool.query(
            `INSERT INTO prescriptions 
       (worker_id, doctor_id, diagnosis, medications, voice_note_url, hospital_name, district, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [
                finalWorkerId,
                req.user.id,
                diagnosis,
                JSON.stringify(medications),
                voiceNoteUrl,
                req.user.hospitalName || 'Unknown Hospital',
                district,
                latitude,
                longitude
            ]
        );

        const prescription = result.rows[0];

        // Emit real-time update via Socket.IO (will be handled in server.js)
        if (req.io) {
            req.io.emit('newCase', {
                id: prescription.id,
                diagnosis,
                district,
                latitude,
                longitude,
                hospitalName: req.user.hospitalName,
                createdAt: prescription.created_at
            });
        }

        res.status(201).json({
            message: 'Case reported successfully',
            prescription
        });
    } catch (error) {
        console.error('Submit case error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get case statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { timeRange = '7d' } = req.query;

        let dateFilter = '';
        if (timeRange === '24h') {
            dateFilter = "AND created_at > NOW() - INTERVAL '24 hours'";
        } else if (timeRange === '7d') {
            dateFilter = "AND created_at > NOW() - INTERVAL '7 days'";
        } else if (timeRange === '30d') {
            dateFilter = "AND created_at > NOW() - INTERVAL '30 days'";
        }

        // Total cases
        const totalResult = await pool.query(
            `SELECT COUNT(*) as total FROM prescriptions WHERE 1=1 ${dateFilter}`
        );

        // Cases by district
        const byDistrictResult = await pool.query(
            `SELECT district, COUNT(*) as count 
       FROM prescriptions 
       WHERE district IS NOT NULL ${dateFilter}
       GROUP BY district 
       ORDER BY count DESC`
        );

        // Cases by diagnosis
        const byDiagnosisResult = await pool.query(
            `SELECT diagnosis, COUNT(*) as count 
       FROM prescriptions 
       WHERE 1=1 ${dateFilter}
       GROUP BY diagnosis 
       ORDER BY count DESC 
       LIMIT 10`
        );

        // Active workers (distinct workers with prescriptions)
        const activeWorkersResult = await pool.query(
            `SELECT COUNT(DISTINCT worker_id) as count 
       FROM prescriptions 
       WHERE worker_id IS NOT NULL ${dateFilter}`
        );

        // Today's cases
        const todayResult = await pool.query(
            `SELECT COUNT(*) as count 
       FROM prescriptions 
       WHERE DATE(created_at) = CURRENT_DATE`
        );

        res.json({
            totalCases: parseInt(totalResult.rows[0].total),
            todayCases: parseInt(todayResult.rows[0].count),
            activeWorkers: parseInt(activeWorkersResult.rows[0].count),
            byDistrict: byDistrictResult.rows,
            byDiagnosis: byDiagnosisResult.rows
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get heatmap data (coordinates for visualization)
router.get('/heatmap', authenticateToken, async (req, res) => {
    try {
        const { timeRange = '7d' } = req.query;

        let dateFilter = '';
        if (timeRange === '24h') {
            dateFilter = "AND created_at > NOW() - INTERVAL '24 hours'";
        } else if (timeRange === '7d') {
            dateFilter = "AND created_at > NOW() - INTERVAL '7 days'";
        } else if (timeRange === '30d') {
            dateFilter = "AND created_at > NOW() - INTERVAL '30 days'";
        }

        const result = await pool.query(
            `SELECT latitude, longitude, diagnosis, district, created_at
       FROM prescriptions 
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL ${dateFilter}
       ORDER BY created_at DESC`
        );

        // Group by location for intensity
        const locationMap = {};
        result.rows.forEach(row => {
            const key = `${row.latitude},${row.longitude}`;
            if (!locationMap[key]) {
                locationMap[key] = {
                    lat: parseFloat(row.latitude),
                    lng: parseFloat(row.longitude),
                    weight: 0,
                    district: row.district,
                    diagnoses: []
                };
            }
            locationMap[key].weight += 1;
            if (!locationMap[key].diagnoses.includes(row.diagnosis)) {
                locationMap[key].diagnoses.push(row.diagnosis);
            }
        });

        res.json({
            heatmapData: Object.values(locationMap),
            rawCases: result.rows.length
        });
    } catch (error) {
        console.error('Get heatmap error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get disease trends
router.get('/trends', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
         DATE(created_at) as date,
         diagnosis,
         COUNT(*) as count
       FROM prescriptions
       WHERE created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at), diagnosis
       ORDER BY date ASC`
        );

        // Transform to chart-friendly format
        const trends = {};
        result.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            if (!trends[dateStr]) {
                trends[dateStr] = { date: dateStr };
            }
            trends[dateStr][row.diagnosis] = parseInt(row.count);
        });

        res.json({ trends: Object.values(trends) });
    } catch (error) {
        console.error('Get trends error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
