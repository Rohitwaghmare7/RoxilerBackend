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
        $group: {
          _id: null,
          soldCount: { $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] } },
          notSoldCount: { $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] } },
        },
      },
    ];

    const result = await Product.aggregate(pipeline).exec();
    const stats = result.length > 0 ? result[0] : { soldCount: 0, notSoldCount: 0 };

    res.status(200).json({
      month: parseInt(month),
      soldCount: stats.soldCount,
      notSoldCount: stats.notSoldCount,
    });
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).send('Server error occurred while fetching pie chart data');
  }
});

module.exports = router;
