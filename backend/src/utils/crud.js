const crudControllers = (model) => ({
  createOne: async (req, res) => {
    try {
      const doc = await model.create({ ...req.body, createdBy: req.userId });
      res.status(201).json({ success: true, result: doc });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  getMany: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.items) || 10;
      const skip = (page - 1) * limit;

      const docs = await model.find().skip(skip).limit(limit).sort({ createdAt: -1 });

      const total = await model.countDocuments();

      res.status(200).json({
        success: true,
        result: docs,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
        },
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  getOne: async (req, res) => {
    try {
      const doc = await model.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, error: 'No document found' });
      }
      res.status(200).json({ success: true, result: doc });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  updateOne: async (req, res) => {
    try {
      const doc = await model.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.userId },
        { new: true }
      );
      if (!doc) {
        return res.status(404).json({ success: false, error: 'No document found' });
      }
      res.status(200).json({ success: true, result: doc });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  removeOne: async (req, res) => {
    try {
      const doc = await model.findByIdAndDelete(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, error: 'No document found' });
      }
      res.status(200).json({ success: true, result: doc });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
});

module.exports = { crudControllers };
