'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReauthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReauth = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // First, clear the existing account
      const clearResponse = await fetch('/api/auth/clear-account', {
        method: 'POST',
      });
      
      if (!clearResponse.ok) {
        throw new Error('Failed to clear account');
      }

      const clearData = await clearResponse.json();
      setMessage(clearData.message);
      
      // Sign out to clear session
      setTimeout(() => {
        window.location.href = '/api/auth/signout?callbackUrl=/login';
      }, 2000);
    } catch (error) {
      console.error('Error during reauth:', error);
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-gray-900 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Re-authenticate with Microsoft</h1>
        
        <div className="space-y-4 text-gray-300">
          <p>
            To enable email access, you need to re-authenticate with Microsoft and grant the necessary permissions.
          </p>
          
          <div className="bg-yellow-900/20 border border-yellow-800 rounded p-4">
            <p className="text-yellow-400 text-sm">
              <strong>Note:</strong> This will sign you out and require you to sign in again with Microsoft.
            </p>
          </div>
          
          <div className="bg-gray-800 rounded p-4">
            <p className="text-sm mb-2">When you sign in again, make sure to:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Accept all requested permissions</li>
              <li>Check "Consent on behalf of your organization" if available</li>
              <li>Allow offline access when prompted</li>
            </ul>
          </div>
        </div>
        
        {message && (
          <div className={`mt-4 p-4 rounded ${message.includes('Error') ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleReauth}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Clear Account & Re-authenticate'}
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}