import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '../types';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">System Alerts & Notifications</h2>
          <p className="text-xs text-slate-400">Budget overspend alerts, subscription renewal warnings, and AI insight updates</p>
        </div>
        <Button size="sm" variant="outline" onClick={markAllRead} className="gap-2">
          <CheckCheck className="w-4 h-4" /> Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((item) => (
          <Card
            key={item.id}
            className={`p-4 ${item.isRead ? 'opacity-75' : 'border-indigo-500/40 bg-indigo-950/20'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                  <p className="text-xs text-slate-400">{item.message}</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">{formatDate(item.createdAt)}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
