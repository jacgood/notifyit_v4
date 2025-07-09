'use client';

import { useState, useRef } from 'react';
import { AlertList, AlertListRef } from '@/components/features/AlertList';
import { AlertStatus } from '@prisma/client';
import { UserProfile } from '@/components/features/UserProfile';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | AlertStatus>('all');
  const alertListRef = useRef<AlertListRef>(null);


  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">OnCall Alert Manager</h1>
          <UserProfile />
        </div>
        

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Alerts
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'PENDING'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('ACKNOWLEDGED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'ACKNOWLEDGED'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Acknowledged
          </button>
        </div>

        {/* Alerts */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            {activeTab === 'all' 
              ? 'All Alerts' 
              : activeTab === 'PENDING' 
              ? 'Pending Alerts' 
              : 'Acknowledged Alerts'}
          </h2>
          <AlertList 
            ref={alertListRef}
            status={activeTab === 'all' ? undefined : activeTab}
            key={activeTab} // Force re-render when tab changes
          />
        </div>
      </div>
    </div>
  );
}