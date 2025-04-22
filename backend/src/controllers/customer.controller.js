const Customer = require('../models/coreModels/Customer');
const { crudControllers } = require('../utils/crud');

const customerControllers = crudControllers(Customer);

// Override the getMany method to handle empty data case
customerControllers.getMany = async (req, res) => {
  try {
    const docs = await Customer.find({}).sort({ createdAt: -1 }).lean().exec();

    if (!docs || docs.length === 0) {
      return res.status(200).json({
        success: true,
        result: [],
        message: 'No customers found',
      });
    }

    return res.status(200).json({
      success: true,
      result: docs,
      message: 'Successfully found all customers',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = customerControllers;
