const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

router.get('/', async (req, res) => {
  const { search = '', month, page = 1, perPage = 10 } = req.query;

  if (month && (month < 1 || month > 12)) {
    return res.status(400).send('Invalid month value. Must be between 1 and 12.');
  }

  const skip = (parseInt(page) - 1) * parseInt(perPage);
  const limit = parseInt(perPage);

  const pipeline = [];

  if (search) {
    const searchNumber = parseFloat(search);
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          {
            $expr: {
              $and: [
                { $ne: [{ $type: '$price' }, 'missing'] },
                {
                  $or: [
                    { $eq: [{ $toString: '$price' }, search] },
                    { $eq: ['$price', searchNumber] },
                    {
                      $and: [
                        { $gte: ['$price', searchNumber - 0.01] },
                        { $lte: ['$price', searchNumber + 0.01] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    });
  }

  if (month) {
    pipeline.push({
      $match: {
        $expr: {
          $eq: [{ $month: '$dateOfSale' }, parseInt(month)],
        },
      },
    });
  }

  try {
    const totalRecordsPipeline = [...pipeline];
    totalRecordsPipeline.push({ $count: 'total' });

    const totalResult = await Product.aggregate(totalRecordsPipeline).exec();
    const totalRecords = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const transactions = await Product.aggregate(pipeline).exec();

    res.status(200).json({
      transactions,
      currentPage: parseInt(page),
      perPage: parseInt(perPage),
      totalRecords,
      totalPages: Math.ceil(totalRecords / perPage),
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Server error occurred while fetching transactions');
  }
});

module.exports = router;
