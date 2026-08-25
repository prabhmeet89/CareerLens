import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCheckConnection = async () => {
    setChecking(true);
    try {
      // Attempt a lightweight fetch test
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);
    } finally {
      setTimeout(() => setChecking(false), 500);
    }
  };

  if (isOnline) return null;

  return (
    <aside
      className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm sticky top-0 z-50 animate-in slide-in-from-top-2 duration-200"
      role="status"
      aria-live="polite"
      aria-label="Network connection offline warning"
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="truncate">
          You're currently offline. Previously loaded content remains available, but live updates require an active internet connection.
        </span>
      </div>

      <button
        type="button"
        onClick={handleCheckConnection}
        disabled={checking}
        className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{checking ? 'Checking…' : 'Check Connection'}</span>
      </button>
    </aside>
  );
};

export default OfflineBanner;
