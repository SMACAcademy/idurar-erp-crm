const mongoose = require('mongoose');

const Model = mongoose.model('Query');

const remove = async (req, res) => {
  const deletedQuery = await Model.findOneAndUpdate(
    {
      _id: req.params.id,
      removed: false,
    },
    {
      $set: {
        removed: true,
      },
    }
  ).exec();

  if (!deletedQuery) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Query not found',
    });
  }

  return res.status(200).json({
    success: true,
    result: deletedQuery,
    message: 'Query deleted successfully',
  });
};

module.exports = remove;
