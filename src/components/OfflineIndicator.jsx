import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline.current) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
      wasOffline.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOffline.current = true;
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] text-center text-sm font-medium py-2 px-4 flex items-center justify-center gap-2 transition-colors duration-300 ${
        showReconnected
          ? 'bg-[#00A651] text-white'
          : 'bg-amber-500 text-white'
      }`}
    >
      {showReconnected ? (
        <>
          <Wifi size={16} />
          Back online — syncing...
        </>
      ) : (
        <>
          <WifiOff size={16} />
          You're offline — changes will sync when connected
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
