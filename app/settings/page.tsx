'use client';

import { useState } from 'react';
import { UserProfile } from '@/components/features/UserProfile';
import { urlBase64ToUint8Array } from '@/lib/utils/push-test';
import Link from 'next/link';

export default function SettingsPage() {
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'enabling' | 'enabled' | 'error'>('idle');

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('error');
      alert('Notifications not supported in this browser');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      setNotificationStatus('error');
      alert('Service workers not supported in this browser');
      return;
    }

    setNotificationStatus('enabling');

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationStatus('error');
        alert('Notification permission denied');
        return;
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from server
      const pushResponse = await fetch('/api/push');
      if (!pushResponse.ok) {
        throw new Error('Failed to fetch VAPID key from server');
      }
      
      const pushData = await pushResponse.json();
      
      if (!pushData.vapidPublicKey) {
        throw new Error('VAPID public key not available');
      }
      
      console.log('VAPID Public Key:', pushData.vapidPublicKey);
      console.log('VAPID Key Length:', pushData.vapidPublicKey.length);
      
      const applicationServerKey = urlBase64ToUint8Array(pushData.vapidPublicKey);
      console.log('Converted key byte length:', applicationServerKey.length);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // Send subscription to server
      const subscribeResponse = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription to server');
      }
      
      setNotificationStatus('enabled');
      console.log('Push notification subscription successful');
    } catch (error) {
      setNotificationStatus('error');
      console.error('Error subscribing to push notifications:', error);
      alert('Failed to enable notifications: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

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
          {/* Notification Settings */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-gray-400">Receive browser notifications for new alerts</p>
                </div>
                <button
                  onClick={requestNotificationPermission}
                  disabled={notificationStatus === 'enabling' || notificationStatus === 'enabled'}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    notificationStatus === 'enabled' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : notificationStatus === 'enabling'
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {notificationStatus === 'enabling' && 'Enabling...'}
                  {notificationStatus === 'enabled' && 'Enabled ✓'}
                  {notificationStatus === 'idle' && 'Enable'}
                  {notificationStatus === 'error' && 'Enable'}
                </button>
              </div>
            </div>
          </div>

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