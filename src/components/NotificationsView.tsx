import React from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { NotificationItem } from "../types";

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-main">System Notifications</h1>
          <p className="text-xs text-gray-600">Audit trail logs for approvals, requests, and updates</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:brightness-90 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-surface rounded-3xl border border-main shadow-2xs divide-y divide-main/30 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">No notifications available.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 transition-colors ${
                n.read ? "bg-surface" : "bg-base border-l-4 border-l-[#A0522D]"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-main text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  {n.title}
                </h3>
                <span className="text-xs text-gray-400 font-medium">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed ml-6">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
