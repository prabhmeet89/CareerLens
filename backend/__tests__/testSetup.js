'use strict';
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

let mongoServer;

/**
 * Connect to an isolated in-memory MongoDB instance for tests.
 */
async function connectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

/**
 * Disconnect and stop the in-memory MongoDB instance.
 */
async function closeTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Clear all data in all collections between test cases.
 */
async function clearTestDB() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

/**
 * Helper to generate a valid JWT token string for a given user or user ID.
 */
function createTestToken(userId) {
  const id = userId._id ? userId._id.toString() : userId.toString();
  return jwt.sign({ userId: id }, process.env.JWT_SECRET || 'test_jwt_secret', {
    expiresIn: '1d',
  });
}

const bcrypt = require('bcryptjs');

/**
 * Helper to create a test user in MongoDB.
 */
async function createTestUser(overrides = {}) {
  const password = overrides.password || 'password123';
  const passwordHash = overrides.passwordHash || (await bcrypt.hash(password, 8));

  const defaultUser = {
    name: 'Alex Rivera',
    email: `alex.${Date.now()}.${Math.random().toString(36).substring(7)}@berkeley.edu`,
    passwordHash,
    role: 'student',
    tagline: 'Aspiring Full Stack Engineer',
  };

  const userPayload = { ...defaultUser, ...overrides };
  delete userPayload.password; // Ensure plain text password is not passed to Mongoose
  userPayload.passwordHash = passwordHash;

  return await User.create(userPayload);
}

module.exports = {
  connectTestDB,
  closeTestDB,
  clearTestDB,
  createTestToken,
  createTestUser,
};
