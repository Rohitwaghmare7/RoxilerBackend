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
          totalSaleAmount: {
            $sum: {
              $cond: [{ $eq: ['$sold', true] }, '$price', 0],
            },
          },
          totalSoldItems: {
            $sum: {
              $cond: [{ $eq: ['$sold', true] }, 1, 0],
            },
          },
          totalNotSoldItems: {
            $sum: {
              $cond: [{ $eq: ['$sold', false] }, 1, 0],
            },
          },
        },
      },
    ];

    const result = await Product.aggregate(pipeline).exec();

    const stats = result.length > 0 ? result[0] : {
      totalSaleAmount: 0,
      totalSoldItems: 0,
      totalNotSoldItems: 0,
    };

    res.status(200).json({
      month: parseInt(month),
      totalSaleAmount: stats.totalSaleAmount,
      totalSoldItems: stats.totalSoldItems,
      totalNotSoldItems: stats.totalNotSoldItems,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).send('Server error occurred while fetching statistics');
  }
});

module.exports = router;
