import React from 'react';

const EmptyState = ({ icon: Icon, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#00A651]" />
        </div>
      )}
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      )}
      {message && (
        <p className="text-gray-500 text-sm max-w-sm">{message}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 px-6 py-3 bg-[#005028] text-white rounded-lg font-semibold hover:bg-[#00A651] transition-colors min-h-[44px]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
