const downloadPdf = require('@/handlers/downloadHandler/downloadPdf');
const express = require('express');

const router = express.Router();

router.post('/:directory/:id', async function (req, res) {
  console.log('loging',req.body.summary);
  try {
    const { directory, id } = req.params;
    await downloadPdf(req, res, { directory, id }); // Same handler reused
  } catch (error) {
    return res.status(503).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
});


module.exports = router;
