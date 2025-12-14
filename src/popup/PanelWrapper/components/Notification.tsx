import React, { useEffect, useState } from 'react';

import './Notification.scss';

interface NotificationProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`notification ${isVisible ? 'notification-visible' : ''}`}>
      <div className="notification-content">
        <span>{message}</span>
        <button className="notification-close" onClick={() => setIsVisible(false)}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Notification;
