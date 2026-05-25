const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codeitz', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.warn('WARNING: The Express server is running without an active MongoDB connection.');
    console.warn('Please check your network connection, database credentials, or ensure your IP address is whitelisted (0.0.0.0/0) in MongoDB Atlas.');
  }
};

module.exports = connectDB;
