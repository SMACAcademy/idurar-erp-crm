const query = async (Model, req, res) => {
  try {
    const { status, customerName, fromDate, toDate } = req.query;

    // Build dynamic filter
    let filter = { removed: false };

    if (status) filter.status = status;
    if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
    if (fromDate && toDate) {
      filter.createdDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    const results = await Model.find(filter).sort({ createdDate: -1 });

    return res.status(200).json({
      success: true,
      result: results,
      message: 'Query results fetched successfully',
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while executing query',
    });
  }
};

module.exports = query;
