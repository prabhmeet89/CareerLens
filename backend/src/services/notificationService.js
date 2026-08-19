'use strict';
const Notification = require('../models/Notification');

/**
 * Create a notification in MongoDB and emit it to the user's Socket.IO room.
 *
 * @param {string} userId - Target user's MongoDB ObjectId string
 * @param {{ type, title, message, jobId? }} payload - Notification payload
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
async function createAndEmit(userId, payload, io) {
  const notif = await Notification.create({
    userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    jobId: payload.jobId || null,
    read: false,
  });

  if (io) {
    io.to(userId.toString()).emit('notification:new', {
      id: notif._id.toString(),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      jobId: notif.jobId,
      read: false,
      createdAt: notif.createdAt,
    });
  }

  return notif;
}

module.exports = { createAndEmit };
