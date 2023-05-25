const databaseConfig = {
    local: 'mongodb://127.0.0.1:27017/walkie',
    production: process.env.MONGO_URI,
  };
  
  module.exports = databaseConfig;
  
