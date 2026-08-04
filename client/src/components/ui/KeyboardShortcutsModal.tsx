import React from 'react';
import { Modal } from './Modal';

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Cmd / Ctrl + K', description: 'Open Global Command Palette' },
    { key: '?', description: 'Show Keyboard Shortcuts Help' },
    { key: 'g d', description: 'Go to Dashboard' },
    { key: 'g t', description: 'Go to Transaction Ledger' },
    { key: 'g s', description: 'Go to Subscriptions Manager' },
    { key: 'g a', description: 'Go to AI Financial Advisor' },
    { key: 'g b', description: 'Go to Budgets & Goals' },
    { key: 'g r', description: 'Go to Analytics Reports' },
    { key: 'g w', description: 'Go to Accounts & Wallets' },
    { key: 'ESC', description: 'Close any active modal or drawer' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts Reference">
      <div className="space-y-3 py-2">
        {shortcuts.map((s) => (
          <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 text-xs">
            <span className="text-slate-300 font-medium">{s.description}</span>
            <kbd className="px-2 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-300">
              {s.key}
            </kbd>
          </div>
        ))}
      </div>
    </Modal>
  );
};
