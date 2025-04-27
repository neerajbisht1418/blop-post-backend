const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/environment');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.log('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
