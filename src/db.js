const mongoose = require('mongoose');
require('dotenv').config();
const databaseConfig = require('./config/database');

const connectToDatabase = async (env) => {
  try {
    if (!databaseConfig[env]) {
      throw new Error('Invalid environment');
    }

    const uri = databaseConfig[env];

    await mongoose.connect(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    const databaseType = env === 'local' ? 'Local Database' : 'Cloud Database';

    console.log(`Connected to ${databaseType} successfully!`);
    
  } catch (error) {
    console.log(`MongoDB connection error: ${error}`);
  }
};

module.exports = connectToDatabase;
