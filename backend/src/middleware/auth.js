const jwt = require('jsonwebtoken');
const Admin = require('../models/coreModels/Admin');

const validateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'No authentication token, authorization denied.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findOne({ _id: decoded.id });

    if (!admin) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'No admin found with this token.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Token validation failed',
      error: error.message,
    });
  }
};

module.exports = { validateToken };
