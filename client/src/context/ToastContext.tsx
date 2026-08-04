import React, { createContext, useContext, useState } from 'react';
import { Badge } from '../components/ui/Badge';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'warning' | 'danger' | 'info';
}

interface ToastContextType {
  showToast: (title: string, message: string, type?: 'success' | 'warning' | 'danger' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (title: string, message: string, type: 'success' | 'warning' | 'danger' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="p-4 rounded-2xl glass-panel border border-slate-800 shadow-2xl space-y-1 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-100">{toast.title}</h5>
              <Badge variant={toast.type === 'danger' ? 'danger' : toast.type === 'success' ? 'success' : 'purple'}>
                {toast.type || 'info'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
