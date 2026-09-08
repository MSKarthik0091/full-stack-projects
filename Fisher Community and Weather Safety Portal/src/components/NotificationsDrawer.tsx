import React from 'react';
import { X, Bell, CheckCircle2, ShieldAlert, ShoppingBag, Waves } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Notifications Inbox</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Bell className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs">No notifications yet.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && onMarkRead(notif._id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  notif.isRead
                    ? 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                    : 'bg-blue-50/80 dark:bg-slate-800/90 border-blue-400 dark:border-blue-500/40 text-slate-900 dark:text-slate-100 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {notif.type === 'account_approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                    {notif.type === 'purchase_request' && <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                    {notif.type === 'weather_alert' && <Waves className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />}
                    {notif.type === 'account_rejected' && <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />}
                    <h4 className="font-bold text-xs">{notif.title}</h4>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0 mt-1"></span>
                  )}
                </div>

                <p className="text-xs mt-1.5 leading-relaxed">{notif.message}</p>

                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  <span>{notif.isRead ? 'Read' : 'Mark as read'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
