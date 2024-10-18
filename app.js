const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

// Import route files
const indexRoutes = require('./routes/index');
const transactionsRoutes = require('./routes/transactions');
const statisticsRoutes = require('./routes/statistics');
const barChartRoutes = require('./routes/barChart');
const pieChartRoutes = require('./routes/pieChart');
const combinedDataRoutes = require('./routes/combinedData');

const app = express();
const PORT = process.env.PORT || 5000;

const mongoURI = 'mongodb+srv://codewithrohit7:rohit12345@cluster0.wkrrf.mongodb.net/Roxiler';

// MongoDB connection
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Use the routes
app.use('/', indexRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/bar-chart', barChartRoutes);
app.use('/pie-chart', pieChartRoutes);
app.use('/combined-data', combinedDataRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
