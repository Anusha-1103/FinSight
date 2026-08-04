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
    { name: 'AI Advisor', href: '/ai-advisor', icon: Sparkles, badge: 'Gemini' },
    { name: 'Subscriptions', href: '/subscriptions', icon: CalendarDays },
    { name: 'Budgets & Goals', href: '/budgets-goals', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    ...(user?.role === 'ADMIN' ? [{ name: 'Admin Panel', href: '/admin', icon: ShieldAlert }] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#F5F2EB] border-r border-stone-200/60 min-h-screen flex flex-col justify-between p-5 fixed left-0 top-0 z-30">
      <div className="space-y-8">
        {/* Brand Logo - Editorial Style */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-5 h-5 text-[#FAF8F5]" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-black text-stone-900 tracking-tight leading-none">
              FinSight
            </h1>
            <p className="text-[9px] text-stone-500 font-mono tracking-wider mt-0.5 uppercase">WEALTH SYSTEMS</p>
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
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative',
                  isActive
                    ? 'bg-stone-900 text-white font-semibold shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300/30'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-stone-500')} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={cn(
                    "text-[8px] font-bold font-mono px-1 rounded uppercase",
                    isActive ? "bg-stone-800 text-stone-300" : "bg-stone-300/40 text-stone-700"
                  )}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Footer Account Summary */}
      <div className="border-t border-stone-200/60 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-stone-100 flex items-center justify-center font-bold text-xs shrink-0 select-none border border-stone-300">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-stone-800 truncate">{user?.name}</p>
              <p className="text-[9px] font-mono text-stone-500 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-300/40 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
