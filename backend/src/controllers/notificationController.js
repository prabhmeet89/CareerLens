'use strict';
const Notification = require('../models/Notification');

/**
 * @route   GET /api/notifications
 * @desc    Get paginated notifications for the authenticated user
 * @access  Protected
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ userId });
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    const totalPages = Math.ceil(total / limit);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = notifications.map((n) => ({
      ...n,
      id: n._id.toString(),
    }));

    return res.status(200).json({
      success: true,
      data: { notifications: formatted, unreadCount, total, page, limit, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Protected
 */
const markRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read for the current user
 * @access  Protected
 */
const markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notification(s) as read.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
