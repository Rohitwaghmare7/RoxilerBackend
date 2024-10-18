const express = require('express');
const axios = require('axios');
const Product = require('../models/Product');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');

    for (const item of data) {
      const existingProduct = await Product.findOne({ id: item.id });

      if (!existingProduct) {
        const newProduct = new Product({
          id: item.id,
          title: item.title,
          price: item.price,
          description: item.description,
          category: item.category,
          image: item.image,
          sold: item.sold || false,
          dateOfSale: item.dateOfSale || new Date(),
        });

        await newProduct.save();
        console.log(`Product with id ${item.id} added to the database.`);
      } else {
        console.log(`Product with id ${item.id} already exists.`);
      }
    }

    res.status(200).send('Database initialized with seed data');
  } catch (err) {
    console.error('Error initializing database:', err);
    res.status(500).send('Error initializing database');
  }
});

module.exports = router;
