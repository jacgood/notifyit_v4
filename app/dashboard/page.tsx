'use client';

import { useState, useRef } from 'react';
import { AlertList, AlertListRef } from '@/components/features/AlertList';
import { AlertStatus } from '@prisma/client';
import { urlBase64ToUint8Array } from '@/lib/utils/push-test';
import { UserProfile } from '@/components/features/UserProfile';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | AlertStatus>('all');
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'enabling' | 'enabled' | 'error'>('idle');
  const [checkingEmails, setCheckingEmails] = useState(false);
  const alertListRef = useRef<AlertListRef>(null);

  const createTestAlert = async () => {
    try {
      const response = await fetch('/api/alerts/test', {
        method: 'POST',
      });

      if (response.ok) {
        // Alert created successfully - refresh the AlertList
        console.log('Test alert created');
        alertListRef.current?.refresh();
      } else {
        console.error('Failed to create test alert');
      }
    } catch (error) {
      console.error('Error creating test alert:', error);
    }
  };

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

  const checkForVoicemails = async () => {
    setCheckingEmails(true);
    try {
      const response = await fetch('/api/email-monitor/auth0', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Email check result:', data);
        alert(`Found ${data.count || 0} new voicemails`);
        
        // Refresh the alert list if any voicemails were found
        if (data.count > 0) {
          alertListRef.current?.refresh();
        }
      } else {
        const error = await response.json();
        console.error('Email check error:', error);
        
        if (response.status === 401) {
          alert('Authentication required. Please sign in with your Microsoft account to access email monitoring.');
        } else {
          alert(`Failed to check emails: ${error.error || 'Unknown error'}${error.details ? '\nDetails: ' + error.details : ''}`);
        }
      }
    } catch (error) {
      console.error('Error checking emails:', error);
      alert('Failed to check emails');
    } finally {
      setCheckingEmails(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">OnCall Alert Manager</h1>
          <UserProfile />
        </div>
        
        <div className="flex gap-2 mb-6">
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
            {notificationStatus === 'enabled' && 'Notifications Enabled ✓'}
            {notificationStatus === 'idle' && 'Enable Notifications'}
            {notificationStatus === 'error' && 'Enable Notifications'}
          </button>
          <button
            onClick={createTestAlert}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Create Test Alert
          </button>
          <button
            onClick={checkForVoicemails}
            disabled={checkingEmails}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingEmails ? 'Checking...' : 'Check for Voicemails'}
          </button>
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