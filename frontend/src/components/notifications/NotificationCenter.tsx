import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import './NotificationCenter.css';

export const NotificationCenter: React.FC = () => {
  const { notifications, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-center">
      <button
        className="notification-center__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="notification-center__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="notification-center__overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="notification-center__panel">
            <div className="notification-center__header">
              <h3>Notifications</h3>
              {notifications.length > 0 && (
                <button
                  className="notification-center__clear"
                  onClick={clearAll}
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="notification-center__list">
              {notifications.length === 0 ? (
                <div className="notification-center__empty">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-center__item ${
                      !notification.read ? 'notification-center__item--unread' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="notification-center__item-icon">
                      {notification.type === 'success' && '✓'}
                      {notification.type === 'warning' && '⚠'}
                      {notification.type === 'error' && '✕'}
                      {notification.type === 'info' && 'ℹ'}
                    </div>
                    <div className="notification-center__item-content">
                      <div className="notification-center__item-title">
                        {notification.title}
                      </div>
                      <div className="notification-center__item-message">
                        {notification.message}
                      </div>
                      <div className="notification-center__item-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};



