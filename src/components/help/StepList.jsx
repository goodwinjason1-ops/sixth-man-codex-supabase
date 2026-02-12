import React from 'react';

const StepList = ({ items }) => (
  <div className="space-y-2.5">
    {items.map((text, i) => (
      <div key={i} className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 bg-[#D4E4D4] rounded-full flex items-center justify-center text-gray-800 text-xs font-bold">
          {i + 1}
        </span>
        <p>{text}</p>
      </div>
    ))}
  </div>
);

export default StepList;
