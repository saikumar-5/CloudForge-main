require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function cleanupGuestAccounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all guest accounts
    const result = await User.deleteMany({ isGuest: true });
    console.log(`Deleted ${result.deletedCount} guest accounts`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupGuestAccounts();
