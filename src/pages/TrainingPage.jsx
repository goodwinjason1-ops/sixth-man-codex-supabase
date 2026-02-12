import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const TrainingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F9F5]">
      {/* Header */}
      <div className="bg-[#005028] border-b border-[#005028]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'My Training' }
            ]}
            className="mb-4 [&_*]:text-green-200 [&_button]:!text-green-300 [&_button:hover]:!text-white [&_span.font-medium]:!text-white"
          />
          <h1 className="text-2xl font-bold text-white">My Training Program</h1>
          <p className="text-green-200 mt-1">Training schedules and drills</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-[#D4E4D4] shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-[#F5F9F5] border border-[#D4E4D4] rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-10 h-10 text-[#005028]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Training Program</h2>
          <p className="text-[#6B7C6B]">Training schedules and drills coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
