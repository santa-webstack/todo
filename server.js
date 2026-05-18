const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully! 🎉'))
  .catch((err) => console.error('MongoDB Connection Error: ', err));

// Routes 
app.use('/api/todos', require('./routes/todoRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.send('To-Do App Backend is Running Perfectly!');
});

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});