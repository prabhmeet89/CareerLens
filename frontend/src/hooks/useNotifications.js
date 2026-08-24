import { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosClient';
import { useSocket } from '../context/SocketContext';

/**
 * Hook for fetching and live-updating notifications.
 * Listens for Socket.IO 'notification:new' events and prepends them.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket() || {};

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications?limit=20');
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Live socket listener for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNew = (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification:new', handleNew);
    return () => socket.off('notification:new', handleNew);
  }, [socket]);

  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
}
