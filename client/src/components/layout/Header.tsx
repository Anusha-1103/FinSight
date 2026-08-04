import React from 'react';
import { Sparkles, Globe, Command, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationsPopover } from './NotificationsPopover';
import { Button } from '../ui/Button';

export interface HeaderProps {
  onOpenAIChat?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAIChat, onOpenCommandPalette, onOpenShortcuts }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 glass-panel border-b border-slate-800/80 sticky top-0 z-20 px-6 flex items-center justify-between ml-64">
      {/* Title / Welcome */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            Welcome back, <span className="text-indigo-400">{user?.name}</span> 👋
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">FinSight AI Portfolio Dashboard</p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Cmd+K Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all font-mono"
        >
          <Command className="w-3.5 h-3.5 text-indigo-400" />
          <span>Search (Cmd+K)</span>
        </button>

        {/* Keyboard Shortcuts (?) */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Currency badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>{user?.currency || 'USD'} ($)</span>
        </div>

        {/* AI Financial Advisor Quick Floating Button */}
        <Button
          onClick={onOpenAIChat}
          variant="glass"
          size="sm"
          className="gap-2 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/60 shadow-lg shadow-indigo-500/10"
        >
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="hidden sm:inline font-semibold">Ask FinSight AI</span>
        </Button>

        {/* Notifications Popover */}
        <NotificationsPopover />
      </div>
    </header>
  );
};
