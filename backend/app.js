'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
// Import routes
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');

// Middleware configuration
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route registrations
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('Welcome to the API!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;