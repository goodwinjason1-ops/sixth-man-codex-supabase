import React from 'react';
import { useData } from '../contexts/DataContext';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';

const ConnectionStatus = ({ className = '' }) => {
  const { isOnline, pendingSync } = useData();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isOnline ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#065f46] border border-[#22c55e] rounded-full">
          <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
          <span className="text-[#4ade80] text-xs font-medium hidden sm:inline">Online</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 border border-red-500 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-400 text-xs font-medium hidden sm:inline">Offline</span>
          </div>
          {pendingSync > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/50 border border-yellow-600 rounded-full">
              <CloudOff className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 text-xs font-medium">{pendingSync}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
