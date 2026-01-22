const jwt = require('jsonwebtoken');

// Middleware to verify worker JWT token
const authenticateWorker = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Ensure this is a worker token
        if (decoded.type !== 'worker') {
            return res.status(403).json({ error: 'Invalid token type' });
        }

        req.worker = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { authenticateWorker };
