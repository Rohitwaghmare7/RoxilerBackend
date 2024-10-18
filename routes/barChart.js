const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

router.get('/', async (req, res) => {
  const { month } = req.query;

  if (!month || month < 1 || month > 12) {
    return res.status(400).send('Invalid month value. Must be between 1 and 12.');
  }

  try {
    const pipeline = [
      {
        $match: {
          $expr: {
            $eq: [{ $month: '$dateOfSale' }, parseInt(month)],
          },
        },
      },
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
          default: '1000+',
          output: {
            totalSold: {
              $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] },
            },
            totalNotSold: {
              $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] },
            },
          },
        },
      },
    ];

    const result = await Product.aggregate(pipeline).exec();

    res.status(200).json({
      month: parseInt(month),
      priceBuckets: result,
    });
  } catch (error) {
    console.error('Error fetching bar chart data:', error);
    res.status(500).send('Server error occurred while fetching bar chart data');
  }
});

module.exports = router;
