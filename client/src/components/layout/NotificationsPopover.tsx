import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '../../types';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export const NotificationsPopover: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/all/read');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-100">Notifications</h4>
              {unreadCount > 0 && <Badge variant="danger">{unreadCount} new</Badge>}
            </div>
            <button
              onClick={markAllRead}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No new notifications</p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    item.isRead ? 'bg-slate-900/30 border-slate-800/40 text-slate-400' : 'bg-indigo-950/20 border-indigo-500/30 text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className="text-xs font-bold">{item.title}</h5>
                    <span className="text-[10px] text-slate-500">{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
