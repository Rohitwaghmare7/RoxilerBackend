const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

router.get('/', async (req, res) => {
  const { month } = req.query;

  if (!month || month < 1 || month > 12) {
    return res.status(400).send('Invalid month value. Must be between 1 and 12.');
  }

  try {
    // Fetch bar chart data
    const barChartPipeline = [
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
            totalSold: { $sum: { $cond: [{ $eq: ['$sold', true] }, 1, 0] } },
            totalNotSold: { $sum: { $cond: [{ $eq: ['$sold', false] }, 1, 0] } },
          },
        },
      },
    ];
    const barChartData = await Product.aggregate(barChartPipeline).exec();

    // Fetch pie chart data
    const pieChartPipeline = [
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
    const pieChartData = await Product.aggregate(pieChartPipeline).exec();
    const pieChartStats = pieChartData.length > 0 ? pieChartData[0] : { soldCount: 0, notSoldCount: 0 };

    res.status(200).json({
      month: parseInt(month),
      barChartData,
      pieChartData: pieChartStats,
    });
  } catch (error) {
    console.error('Error fetching combined chart data:', error);
    res.status(500).send('Server error occurred while fetching combined chart data');
  }
});

module.exports = router;
