const listAll = async (Model, req, res) => {
  try {
    // Sorting
    const sortBy = req.query.sortBy || 'created';
    const sortOrder = (req.query.sort || 'desc').toLowerCase() === 'asc' ? 1 : -1;

    // Base criteria
    const criteria = { removed: false };

    // Optional direct filters
    if (typeof req.query.enabled !== 'undefined') {
      const v = String(req.query.enabled).toLowerCase();
      if (v === 'true' || v === 'false') criteria.enabled = v === 'true';
    }
    if (req.query.createdBy) criteria.createdBy = req.query.createdBy;
    if (req.query.assigned) criteria.assigned = req.query.assigned;
    if (req.query.email) criteria.email = req.query.email;
    if (req.query.country) criteria.country = req.query.country;

    // Optional search (q + fields)
    const { q, fields } = req.query;
    if (q) {
      const fieldsArray = (fields ? String(fields).split(',') : ['name', 'email', 'phone']).filter(Boolean);
      criteria.$or = fieldsArray.map((f) => ({ [f.trim()]: { $regex: new RegExp(q, 'i') } }));
    }

    const result = await Model.find(criteria).sort({ [sortBy]: sortOrder }).exec();

    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        result,
        pagination: {
          page: 1,
          count: result.length,
          items: result.length,
        },
        message: 'Successfully found all documents',
      });
    } else {
      return res.status(200).json({
        success: true,
        result: [],
        pagination: {
          page: 1,
          count: 0,
          items: 0,
        },
        message: 'Collection is Empty',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = listAll;
