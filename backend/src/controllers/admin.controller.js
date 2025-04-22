const Admin = require('../models/coreModels/Admin');
const { handleError } = require('../utils/errorHandler');

// Get all admins
exports.getAll = async (req, res) => {
  try {
    const admins = await Admin.find({ removed: false });
    res.json(admins);
  } catch (error) {
    handleError(res, error);
  }
};

// Get admin by ID
exports.getById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin || admin.removed) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    handleError(res, error);
  }
};

// Create new admin
exports.create = async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json(admin);
  } catch (error) {
    handleError(res, error);
  }
};

// Update admin
exports.update = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!admin || admin.removed) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete admin (soft delete)
exports.delete = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.params.id, { removed: true }, { new: true });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};
