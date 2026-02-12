import React from 'react';
import { useData } from '../contexts/DataContext';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';

const ConnectionStatus = ({ className = '' }) => {
  const { isOnline, pendingSync } = useData();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isOnline ? (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005028] border border-[#00A651] rounded-full">
          <div className="w-2 h-2 rounded-full bg-[#00A651] animate-pulse" />
          <span className="text-[#00A651] text-xs font-medium hidden sm:inline">Online</span>
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
