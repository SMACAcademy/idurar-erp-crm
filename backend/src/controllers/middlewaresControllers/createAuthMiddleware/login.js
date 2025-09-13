const Joi = require('joi');
const mongoose = require('mongoose');
const authUser = require('./authUser');  // Relative path to authUser.js in same folder

const login = async (req, res, { userModel = 'Admin' } = {}) => {  // Use 'Admin' for admin login
  const UserPasswordModel = mongoose.model(userModel + 'Password');
  const UserModel = mongoose.model(userModel);
  const { email, password } = req.body;

  const objectSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: true } }).required(),
    password: Joi.string().required(),
  });
  const { error } = objectSchema.validate({ email, password });
  if (error) {
    return res.status(409).json({ success: false, result: null, message: 'Invalid/Missing credentials.', errorMessage: error.message });
  }

  const user = await UserModel.findOne({ email: email, removed: false });
  if (!user) {
    return res.status(404).json({ success: false, result: null, message: 'No account with this email has been registered.' });
  }

  const databasePassword = await UserPasswordModel.findOne({ user: user._id, removed: false });
  if (!databasePassword) {
    return res.status(404).json({ success: false, result: null, message: 'Password not found.' });
  }

  if (!user.enabled) {
    return res.status(409).json({ success: false, result: null, message: 'Your account is disabled, contact your account administrator.' });
  }

  // Call authUser
  authUser(req, res, { user, databasePassword, password, UserPasswordModel });
};

module.exports = login;