const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const queryRoutes = require('./query.routes');
const customerRoutes = require('./customer.routes');

// Use routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/query', queryRoutes);
router.use('/customer', customerRoutes);

module.exports = router;
