module.exports = (Model) => {
  return async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const items =
        Math.max(
          parseInt(req.query.items, 10) ||
            parseInt(req.query.limit, 10) || // backward compatibility
            10,
          1
        );
      const skip = (page - 1) * items;

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

      // Sorting options
      const sortBy = req.query.sortBy || 'created';
      const sortOrder = (req.query.sort || 'desc').toLowerCase() === 'asc' ? 1 : -1;

      const [results, total] = await Promise.all([
        Model.find(criteria).sort({ [sortBy]: sortOrder }).skip(skip).limit(items).exec(),
        Model.countDocuments(criteria),
      ]);

      const totalPages = Math.max(Math.ceil(total / items), 1);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return res.status(200).json({
        success: true,
        result: results,
        pagination: {
          page,
          items,
          count: total,
          totalPages,
          hasNext,
          hasPrev,
          nextPage: hasNext ? page + 1 : null,
          prevPage: hasPrev ? page - 1 : null,
        },
        message: 'Successfully found all documents',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        result: null,
        message: err.message,
      });
    }
  };
};
