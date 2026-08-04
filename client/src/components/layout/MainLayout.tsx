import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChatDrawer } from '../ai/AIChatDrawer';
import { CommandPalette } from '../ui/CommandPalette';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // PWA Service Worker Registration
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW reg error:', err));
    }
  }, []);

  useEffect(() => {
    let keyBuffer = '';
    let timer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen((prev) => !prev);
      }

      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }

      // Key chord shortcuts (g + key)
      if (e.key === 'g' || keyBuffer === 'g') {
        if (e.key === 'g') {
          keyBuffer = 'g';
          clearTimeout(timer);
          timer = setTimeout(() => { keyBuffer = ''; }, 1000);
          return;
        }

        if (keyBuffer === 'g') {
          keyBuffer = '';
          switch (e.key) {
            case 'd': navigate('/'); break;
            case 't': navigate('/transactions'); break;
            case 's': navigate('/subscriptions'); break;
            case 'a': navigate('/ai-advisor'); break;
            case 'b': navigate('/budgets-goals'); break;
            case 'r': navigate('/analytics'); break;
            case 'w': navigate('/accounts'); break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenAIChat={() => setIsAIChatOpen(true)}
          onOpenCommandPalette={() => setIsCmdPaletteOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        <main className="flex-1 ml-64 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>

      <AIChatDrawer isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
      <CommandPalette isOpen={isCmdPaletteOpen} onClose={() => setIsCmdPaletteOpen(false)} />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};
