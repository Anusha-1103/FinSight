import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Receipt, Sparkles, CalendarDays, Target, PieChart, Wallet, Settings, ShieldAlert, Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenActionModal?: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onOpenActionModal }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationCommands = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, section: 'Navigation' },
    { name: 'Transactions Ledger', href: '/transactions', icon: Receipt, section: 'Navigation' },
    { name: 'AI Financial Advisor', href: '/ai-advisor', icon: Sparkles, section: 'Navigation' },
    { name: 'Subscriptions', href: '/subscriptions', icon: CalendarDays, section: 'Navigation' },
    { name: 'Budgets & Goals', href: '/budgets-goals', icon: Target, section: 'Navigation' },
    { name: 'Analytics Reports', href: '/analytics', icon: PieChart, section: 'Navigation' },
    { name: 'Connected Accounts', href: '/accounts', icon: Wallet, section: 'Navigation' },
    { name: 'Settings', href: '/settings', icon: Settings, section: 'Navigation' },
  ];

  const filteredCommands = navigationCommands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', duration: 0.25 }}
          className="w-full max-w-xl glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10"
        >
          {/* Search Input Bar */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
            <Search className="w-5 h-5 text-indigo-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search workspace... (Cmd+K)"
              className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Command List */}
          <div className="p-2 max-h-80 overflow-y-auto space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Quick Navigation
            </div>
            {filteredCommands.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching workspace commands found.
              </div>
            ) : (
              filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.name}
                    onClick={() => handleSelect(cmd.href)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-indigo-600/20 hover:border hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      <span className="font-medium">{cmd.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-indigo-300">Jump to →</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts Hint */}
          <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Use ↑↓ to navigate</span>
            <span>ESC to close</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
