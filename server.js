// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('./db/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
Database();

// Import route modules
const authRoutes = require('./routes/authRoutes');
const imageRoutes = require('./routes/imageRoutes');

// Use route modules
app.use('/auth', authRoutes); // Routes for authentication
app.use('/images', imageRoutes); // Routes for image operations

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
