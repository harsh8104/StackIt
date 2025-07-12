
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Notification as ApiNotification } from '@/services/api';

export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
  };
  type: 'answer' | 'vote' | 'mention' | 'comment' | 'accept';
  question?: {
    _id: string;
    title: string;
  };
  answer?: {
    _id: string;
    content: string;
  };
  content: string;
  read: boolean;
  metadata?: {
    voteType?: string;
    questionTitle?: string;
    answerPreview?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!api.isAuthenticated()) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.getNotifications({ limit: 20 });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    if (!api.isAuthenticated()) return;
    
    try {
      const response = await api.markNotificationAsRead(notificationIds);
      setUnreadCount(response.unreadCount);
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n._id) ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!api.isAuthenticated()) return;
    
    try {
      await api.markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!api.isAuthenticated()) return;
    
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      // Refresh unread count in case the deleted notification was unread
      await refreshUnreadCount();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const refreshUnreadCount = async () => {
    if (!api.isAuthenticated()) return;
    
    try {
      const count = await api.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error refreshing unread count:', err);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    // Only fetch if authenticated
    if (api.isAuthenticated()) {
      fetchNotifications();
    }
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      if (api.isAuthenticated()) {
        refreshUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh when authentication state changes
  useEffect(() => {
    if (api.isAuthenticated()) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
