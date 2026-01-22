const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Middleware to verify JWT and check government role
const { authenticateToken, governmentOnly } = require('../middleware/auth');

// Camp types enum
const CAMP_TYPES = [
    'General Checkup',
    'Dengue Checkup',
    'COVID-19',
    'Malaria Screening',
    'Eye Camp',
    'Dental Camp',
    'Vaccination Drive',
    'Blood Donation'
];

/**
 * POST /api/health-camps
 * Create a new health camp and trigger broadcast notification
 */
router.post('/', authenticateToken, governmentOnly, async (req, res) => {
    try {
        const {
            camp_name,
            camp_type,
            location_name,
            latitude,
            longitude,
            maps_link,
            scheduled_date,
            description
        } = req.body;

        // Validation
        if (!camp_name || !camp_type || !location_name || !scheduled_date) {
            return res.status(400).json({
                error: 'Missing required fields: camp_name, camp_type, location_name, scheduled_date'
            });
        }

        if (!CAMP_TYPES.includes(camp_type)) {
            return res.status(400).json({
                error: `Invalid camp_type. Must be one of: ${CAMP_TYPES.join(', ')}`
            });
        }

        // Insert health camp
        const campResult = await pool.query(`
            INSERT INTO health_camps (
                camp_name, camp_type, location_name, 
                latitude, longitude, maps_link, 
                scheduled_date, description, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            camp_name,
            camp_type,
            location_name,
            latitude || null,
            longitude || null,
            maps_link || null,
            scheduled_date,
            description || null,
            req.user.id
        ]);

        const camp = campResult.rows[0];

        // Generate Google Maps link from coordinates if not provided
        let mapsUrl = maps_link;
        if (!mapsUrl && latitude && longitude) {
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        }

        // Create broadcast notification with maps link
        const notificationTitle = `🏕️ New Health Camp: ${camp_name}`;
        const formattedDate = new Date(scheduled_date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let notificationMessage = `${camp_type} at ${location_name} on ${formattedDate}.`;
        if (description) {
            notificationMessage += ` ${description}`;
        }
        if (mapsUrl) {
            notificationMessage += `\n\n📍 Navigate to location: ${mapsUrl}`;
        }

        await pool.query(`
            INSERT INTO notifications (title, message, type, reference_id, is_broadcast)
            VALUES ($1, $2, $3, $4, $5)
        `, [notificationTitle, notificationMessage, 'health_camp', camp.id, true]);

        // Emit real-time update via Socket.IO
        if (req.io) {
            req.io.emit('newHealthCamp', {
                id: camp.id,
                camp_name: camp.camp_name,
                camp_type: camp.camp_type,
                location_name: camp.location_name,
                latitude: camp.latitude,
                longitude: camp.longitude,
                scheduled_date: camp.scheduled_date
            });
        }

        res.status(201).json({
            message: 'Health camp created successfully',
            camp: {
                id: camp.id,
                camp_name: camp.camp_name,
                camp_type: camp.camp_type,
                location_name: camp.location_name,
                latitude: parseFloat(camp.latitude) || null,
                longitude: parseFloat(camp.longitude) || null,
                maps_link: camp.maps_link,
                scheduled_date: camp.scheduled_date,
                description: camp.description,
                status: camp.status,
                created_at: camp.created_at
            }
        });

    } catch (error) {
        console.error('Error creating health camp:', error);
        res.status(500).json({ error: 'Failed to create health camp' });
    }
});

/**
 * GET /api/health-camps
 * List all health camps with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const { status, camp_type, upcoming } = req.query;

        let query = 'SELECT * FROM health_camps WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        if (camp_type) {
            query += ` AND camp_type = $${paramIndex++}`;
            params.push(camp_type);
        }

        if (upcoming === 'true') {
            query += ` AND scheduled_date >= NOW()`;
        }

        query += ' ORDER BY scheduled_date ASC';

        const result = await pool.query(query, params);

        res.json({
            camps: result.rows.map(camp => ({
                id: camp.id,
                camp_name: camp.camp_name,
                camp_type: camp.camp_type,
                location_name: camp.location_name,
                latitude: parseFloat(camp.latitude) || null,
                longitude: parseFloat(camp.longitude) || null,
                maps_link: camp.maps_link,
                scheduled_date: camp.scheduled_date,
                description: camp.description,
                status: camp.status,
                created_at: camp.created_at
            })),
            total: result.rows.length,
            camp_types: CAMP_TYPES
        });

    } catch (error) {
        console.error('Error fetching health camps:', error);
        res.status(500).json({ error: 'Failed to fetch health camps' });
    }
});

/**
 * GET /api/health-camps/:id
 * Get specific health camp details
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM health_camps WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Health camp not found' });
        }

        const camp = result.rows[0];

        res.json({
            camp: {
                id: camp.id,
                camp_name: camp.camp_name,
                camp_type: camp.camp_type,
                location_name: camp.location_name,
                latitude: parseFloat(camp.latitude) || null,
                longitude: parseFloat(camp.longitude) || null,
                maps_link: camp.maps_link,
                scheduled_date: camp.scheduled_date,
                description: camp.description,
                status: camp.status,
                created_at: camp.created_at
            }
        });

    } catch (error) {
        console.error('Error fetching health camp:', error);
        res.status(500).json({ error: 'Failed to fetch health camp' });
    }
});

/**
 * GET /api/health-camps/types
 * Get list of available camp types
 */
router.get('/meta/types', (req, res) => {
    res.json({ camp_types: CAMP_TYPES });
});

module.exports = router;
