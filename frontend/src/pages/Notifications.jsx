import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  UserGroupIcon,
  TrophyIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      let url = '/notifications?limit=50';
      if (filter === 'unread') {
        url += '&is_read=false';
      } else if (filter === 'read') {
        url += '&is_read=true';
      }
      
      const response = await api.get(url);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getNotificationIcon = (type, priority) => {
    const baseClass = "w-10 h-10 p-2 rounded-full";
    
    switch (type) {
      case 'task_created':
        return (
          <div className={`${baseClass} bg-blue-100`}>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-600" />
          </div>
        );
      case 'task_assigned':
        return (
          <div className={`${baseClass} bg-purple-100`}>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-purple-600" />
          </div>
        );
      case 'task_self_assigned':
        return (
          <div className={`${baseClass} bg-indigo-100`}>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600" />
          </div>
        );
      case 'task_submitted':
        return (
          <div className={`${baseClass} bg-yellow-100`}>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-yellow-600" />
          </div>
        );
      case 'task_approved':
      case 'task_completed':
        return (
          <div className={`${baseClass} bg-green-100`}>
            <CheckIcon className="w-6 h-6 text-green-600" />
          </div>
        );
      case 'task_rejected':
        return (
          <div className={`${baseClass} bg-red-100`}>
            <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
          </div>
        );
      case 'task_updated':
      case 'task_deleted':
        return (
          <div className={`${baseClass} bg-gray-100`}>
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        );
      case 'event_created':
      case 'event_updated':
      case 'event_reminder':
        return (
          <div className={`${baseClass} bg-teal-100`}>
            <CalendarIcon className="w-6 h-6 text-teal-600" />
          </div>
        );
      case 'community_member_joined':
      case 'community_member_left':
        return (
          <div className={`${baseClass} bg-cyan-100`}>
            <UserGroupIcon className="w-6 h-6 text-cyan-600" />
          </div>
        );
      case 'leave_approved':
      case 'leave_rejected':
        return (
          <div className={`${baseClass} bg-orange-100`}>
            <CalendarIcon className="w-6 h-6 text-orange-600" />
          </div>
        );
      default:
        return (
          <div className={`${baseClass} bg-gray-100`}>
            <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    if (!priority || priority === 'medium') return null;
    
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[priority]}`}>
        {priority === 'high' ? '⚡ High Priority' : 'Low Priority'}
      </span>
    );
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-transparent">
      <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Notifications
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Stay updated with your community activities
              </p>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center px-3 sm:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 text-sm"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Mark All Read</span>
                  <span className="sm:hidden">Mark Read</span>
                </button>
              )}
              <div className="hidden sm:flex w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 rounded-lg items-center justify-center">
                <BellIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-1">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  filter === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="glass-card bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
          {error && (
            <div className="p-4 border-b border-red-200 bg-red-50">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`list-item-hover p-6 hover:bg-gray-50 transition-colors duration-200 ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {getNotificationIcon(notification.type, notification.priority)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                              New
                            </span>
                          )}
                          {getPriorityBadge(notification.priority)}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          {notification.community && (
                            <span className="flex items-center">
                              <UserGroupIcon className="w-4 h-4 mr-1" />
                              {notification.community.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.notification_id)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.notification_id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete notification"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
