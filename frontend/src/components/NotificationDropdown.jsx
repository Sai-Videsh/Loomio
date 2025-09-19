import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Bell, Check, Trash2 } from 'lucide-react'
import { notificationsAPI } from '../services/api'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)

  const { data: notifications, refetch } = useQuery(
    ['notifications'],
    () => notificationsAPI.getAll({ limit: 10 }),
    { refetchInterval: 30000 } // Refetch every 30 seconds
  )

  const { data: unreadCount } = useQuery(
    ['notifications', 'unread-count'],
    () => notificationsAPI.getUnreadCount(),
    { refetchInterval: 30000 }
  )

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id)
      refetch()
      toast.success('Notification marked as read')
    } catch (error) {
      toast.error('Failed to mark notification as read')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id)
      refetch()
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      refetch()
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
      >
        <Bell className="h-5 w-5" />
        {unreadCount?.data?.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount.data.unread_count > 9 ? '9+' : unreadCount.data.unread_count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount?.data?.unread_count > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-500"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {notifications?.data?.data?.length > 0 ? (
                notifications.data.data.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0',
                      !notification.is_read && 'bg-primary-50'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-success-600"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 text-gray-400 hover:text-danger-600"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationDropdown
