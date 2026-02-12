import React from 'react';

const LoadingState = ({
  message = 'Loading...',
  submessage,
  fullScreen = true,
}) => {
  const content = (
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-800 font-medium">{message}</p>
      {submessage && (
        <p className="text-gray-500 text-sm mt-1">{submessage}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#F5F9F5] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">{content}</div>
  );
};

export default LoadingState;
