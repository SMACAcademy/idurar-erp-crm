const jwt = require('jsonwebtoken');
const Admin = require('../models/coreModels/Admin');

const validateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findOne({ _id: decoded.id, removed: false });

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.user = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = { validateToken };
