import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Server, Activity, Key } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [uRes, mRes, aRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/metrics'),
        api.get('/admin/audit-logs'),
      ]);

      if (uRes.data.success) setUsers(uRes.data.data);
      if (mRes.data.success) setMetrics(mRes.data.data);
      if (aRes.data.success) setAuditLogs(aRes.data.data);
    } catch (err) {
      console.error('Failed to load admin controls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          System Administration & RBAC Controls
        </h2>
        <p className="text-xs text-slate-400">Platform health metrics, security audit trail, and user permission management</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-500/20">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Platform Users</span>
          <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{metrics?.totalUsers || 0}</h3>
        </Card>
        <Card className="border-emerald-500/20">
          <span className="text-xs text-slate-400 font-semibold uppercase">Processed Transactions</span>
          <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{metrics?.totalTransactions || 0}</h3>
        </Card>
        <Card className="border-blue-500/20">
          <span className="text-xs text-slate-400 font-semibold uppercase">Memory RSS Usage</span>
          <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{metrics?.memoryUsageMB || 0} MB</h3>
        </Card>
        <Card className="border-amber-500/20">
          <span className="text-xs text-slate-400 font-semibold uppercase">Server Uptime</span>
          <h3 className="text-2xl font-extrabold text-slate-100 mt-2">{metrics?.serverUptimeSeconds || 0} sec</h3>
        </Card>
      </div>

      {/* User RBAC Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-100">User Management & Role Permissions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="p-4">
                    <div className="font-bold text-slate-200">{u.name}</div>
                    <div className="text-slate-500 text-[10px]">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant={u.role === 'ADMIN' ? 'danger' : 'neutral'}>{u.role}</Badge>
                  </td>
                  <td className="p-4 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      Set as {u.role === 'ADMIN' ? 'User' : 'Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Audit Trail */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-sm text-slate-100">Security Audit Logs</h3>
        </div>
        <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-indigo-400">[{log.action}]</span>
                <span className="text-slate-300 ml-2">{log.user?.email || 'System'}</span>
                <p className="text-[10px] text-slate-500">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-500">{formatDate(log.createdAt)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
