module.exports = (Model) => {
  return async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [results, total] = await Promise.all([
        Model.find().skip(skip).limit(limit),
        Model.countDocuments()
      ]);

      res.json({ data: results, total, page, limit });
    } catch (err) {
      next(err);
    }
  };
};
