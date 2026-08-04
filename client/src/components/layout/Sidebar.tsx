import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  PieChart,
  Target,
  Wallet,
  CalendarDays,
  ShieldAlert,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'AI Financial Advisor', href: '/ai-advisor', icon: Sparkles, badge: 'Gemini' },
    { name: 'Subscriptions', href: '/subscriptions', icon: CalendarDays },
    { name: 'Budgets & Goals', href: '/budgets-goals', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    ...(user?.role === 'ADMIN' ? [{ name: 'Admin Panel', href: '/admin', icon: ShieldAlert }] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 min-h-screen flex flex-col justify-between p-4 fixed left-0 top-0 z-30">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
              FinSight <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-md font-mono">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">WEALTH INTELLIGENCE</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4 transition-transform group-hover:scale-110', isActive ? 'text-indigo-400' : 'text-slate-500')} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-lg shadow-indigo-500" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer Account Summary */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.name}
              className="w-9 h-9 rounded-full border border-slate-700 object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
