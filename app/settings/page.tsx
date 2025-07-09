'use client';

import { UserProfile } from '@/components/features/UserProfile';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-white mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
          <UserProfile />
        </div>

        <div className="space-y-6">
          {/* Alert Settings */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Alert Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Alert Sound
                </label>
                <select className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
                  <option>Emergency Alert</option>
                  <option>Urgent Beep</option>
                  <option>Critical Alarm</option>
                  <option>High Priority</option>
                  <option>Bell Notification</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Repeat Interval
                </label>
                <select className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600">
                  <option>Every 30 seconds</option>
                  <option>Every 1 minute</option>
                  <option>Every 2 minutes</option>
                  <option>Every 5 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email Monitoring */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Email Monitoring</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Monitor Exchange Email</p>
                  <p className="text-xs text-gray-400">Check for new voicemails every 5 minutes</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Start Monitoring
                </button>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-400">Connected with Azure AD</p>
              <p className="text-gray-400">Email monitoring permissions granted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}