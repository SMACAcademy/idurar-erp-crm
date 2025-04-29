const mongoose = require('mongoose');
const Query = mongoose.model('queries'); // Make sure Query model is registered

const getQueryById = async (req, res) => {
  try {
    const result = await Query.findOne({
      _id: req.params.id,

    })
      .exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No query found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Query retrieved successfully',
    });
  } catch (err) {
    console.error('Error retrieving query:', err.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Server error while retrieving the query',
    });
  }
};

module.exports = {
  getQueryById
};

