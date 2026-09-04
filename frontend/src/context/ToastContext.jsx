import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: 'bg-emerald-50 dark:bg-[#0D2818] border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300',
  error:   'bg-red-50 dark:bg-linkedin-danger-bg border-red-200 dark:border-linkedin-danger/30 text-red-800 dark:text-red-300',
  info:    'bg-blue-50 dark:bg-linkedin-accent-light border-blue-200 dark:border-linkedin-blue/30 text-blue-800 dark:text-blue-300',
  warning: 'bg-amber-50 dark:bg-linkedin-amber-bg border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300',
};

const ICON_COLORS = {
  success: 'text-emerald-500 dark:text-emerald-400',
  error:   'text-red-500 dark:text-linkedin-danger',
  info:    'text-blue-500 dark:text-linkedin-blue',
  warning: 'text-amber-500 dark:text-amber-400',
};

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback(
    ({ type = 'info', message, duration = 4000 }) => {
      const id = ++nextId;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]); // Max 5 toasts

      timersRef.current[id] = setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const toast = {
    success: (message, opts) => addToast({ type: 'success', message, ...opts }),
    error: (message, opts) => addToast({ type: 'error', message, ...opts }),
    info: (message, opts) => addToast({ type: 'info', message, ...opts }),
    warning: (message, opts) => addToast({ type: 'warning', message, ...opts }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm w-full pointer-events-auto
                animate-in slide-in-from-bottom-4 fade-in duration-200 ${COLORS[t.type]}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${ICON_COLORS[t.type]}`} />
              <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
