import React from 'react';
import SlidePanel from './SlidePanel';

const NotificationPanel = ({ open, onClose, notifications = [], children }) => {
  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Notifications"
      headerContent={
        notifications.length > 0 && (
          <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded-full">
            {notifications.length}
          </span>
        )
      }
    >
      <div className="h-[calc(100vh-140px)] overflow-y-auto">
        {children}
      </div>
    </SlidePanel>
  );
};

export default NotificationPanel;