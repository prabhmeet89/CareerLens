const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume2role';

  try {
    console.log(`[MongoDB] Connecting to: ${mongoURI}...`);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to primary URI (${mongoURI}): ${error.message}`);

    // In development or test, fallback to in-memory MongoDB if available
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting in-memory MongoDB fallback server...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const inMemoryUri = mongodInstance.getUri();
        const conn = await mongoose.connect(inMemoryUri);
        console.log(`[MongoDB] Connected successfully to in-memory instance: ${inMemoryUri}`);
        return conn;
      } catch (inMemError) {
        console.error('[MongoDB] In-memory MongoDB failed to start:', inMemError.message);
      }
    }

    console.error('[MongoDB] Database connection failed. Please ensure MongoDB is running or specify a valid MONGO_URI in server/.env');
    return null;
  }
};

module.exports = connectDB;
