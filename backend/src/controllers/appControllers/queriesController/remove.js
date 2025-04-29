const mongoose = require('mongoose');
const Query = require('../../../models/appModels/queries');

const deleteQuery = async (req, res) => {
    try {
        const deletedQuery = await Query.findOneAndDelete({
            _id: req.params.id,
        }).exec();

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
    } catch (error) {
        console.error('Delete Query Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete query',
            error: error.message,
        });
    }
};

module.exports = { deleteQuery };
