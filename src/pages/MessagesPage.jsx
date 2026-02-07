import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const MessagesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-lakers-900">
      {/* Header */}
      <div className="bg-lakers-800 border-b border-lakers-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            path={[
              { label: 'Home', url: '/welcome' },
              { label: 'Messages' }
            ]}
            className="mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-lakers-300 mt-1">Team communications</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-lakers-800 rounded-xl border border-lakers-700 p-8 text-center">
          <div className="w-20 h-20 bg-lakers-700 border border-lakers-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-10 h-10 text-lakers-300" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Team Messages</h2>
          <p className="text-lakers-400">Team communications coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
