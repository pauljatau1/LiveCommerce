import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

function NotificationsDialog({ notifications }) {
  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>All Notifications</DialogTitle>
      </DialogHeader>
      
      <div className="divide-y divide-gray-100">
        {notifications?.map((notification) => (
          <div key={notification._id} className="py-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                
                {notification.data && (
                  <div className="mt-2 text-sm">
                    {Object.entries(notification.data).map(([key, value]) => (
                      <div key={key} className="text-gray-500">
                        <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}: </span>
                        {typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value)}
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              
              {!notification.isRead && (
                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  );
}

export default NotificationsDialog; 