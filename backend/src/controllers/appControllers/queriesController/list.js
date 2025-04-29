const mongoose = require("mongoose");
const Query = require("../../../models/appModels/queries");

const getQuery = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const matchId = req.query.equal;
    const status = req.query.status;

    const filter = {};

    if (matchId) {
      filter.name = matchId;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    const queries = await Query.find(filter)
      .populate("name")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdDate: -1 });

    const total = await Query.countDocuments(filter);

    res.status(200).json({
      success: true,
      result: queries,
      pagination: {
        page,
        count: total,
      },
    });
  } catch (err) {
    console.error("Get Queries Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch queries",
      error: err.message,
    });
  }
};

module.exports = {
  getQuery,
};
