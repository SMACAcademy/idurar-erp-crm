const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Add a customer (no auth required)
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const customer = new Customer({ name });
    await customer.save();
    res.status(201).json({ success: true, name: customer.name });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'Customer already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// Get all customers (no auth required)
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({}, 'name').sort({ name: 1 });
    res.json({ data: customers.map(c => c.name) });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
