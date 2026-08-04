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
    <header className="h-16 bg-[#FAF8F5] border-b border-stone-200/60 sticky top-0 z-20 px-6 flex items-center justify-between ml-64">
      {/* Title / Welcome */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xs font-semibold text-stone-800 flex items-center gap-2">
            Welcome back, <span className="font-serif text-sm font-black text-stone-900">{user?.name}</span> 👋
          </h2>
          <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase mt-0.5">PORTFOLIO OVERVIEW</p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Cmd+K Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-stone-200/80 text-[10px] text-stone-600 hover:text-stone-950 hover:border-stone-300 transition-all font-mono shadow-sm"
        >
          <Command className="w-3.5 h-3.5 text-stone-500" />
          <span>Search (Cmd+K)</span>
        </button>

        {/* Keyboard Shortcuts (?) */}
        <button
          onClick={onOpenShortcuts}
          className="p-2 rounded-lg text-stone-500 hover:text-stone-950 hover:bg-stone-100 border border-stone-200/80 bg-white transition-colors shadow-sm"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Currency badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-200/80 text-[10px] text-stone-600 font-mono shadow-sm">
          <Globe className="w-3.5 h-3.5 text-stone-400" />
          <span>{user?.currency || 'USD'} ($)</span>
        </div>

        {/* AI Financial Advisor Quick Floating Button */}
        <Button
          onClick={onOpenAIChat}
          size="sm"
          className="gap-1.5 bg-stone-900 text-slate-100 hover:bg-stone-800 shadow-sm text-xs font-medium rounded-lg px-3.5 h-8.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          <span className="hidden sm:inline font-sans">Ask Advisor</span>
        </Button>

        {/* Notifications Popover */}
        <NotificationsPopover />
      </div>
    </header>
  );
};
