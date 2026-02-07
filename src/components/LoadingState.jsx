import React from 'react';

const LoadingState = ({
  message = 'Loading...',
  submessage,
  fullScreen = true,
}) => {
  const content = (
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white font-medium">{message}</p>
      {submessage && (
        <p className="text-white/60 text-sm mt-1">{submessage}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#0a3d2e] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">{content}</div>
  );
};

export default LoadingState;
