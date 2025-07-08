'use client';

import { useState } from 'react';
import { urlBase64ToUint8Array } from '@/lib/utils/push-test';
import { testVapidKeyMethods } from '@/lib/utils/crypto-test';

export function VapidKeyTest() {
  const [testResult, setTestResult] = useState<string>('');

  const testVapidKey = async () => {
    try {
      const response = await fetch('/api/push');
      const data = await response.json();
      
      console.log('API Response:', data);
      console.log('Raw VAPID key:', data.vapidPublicKey);
      console.log('Key length:', data.vapidPublicKey?.length);
      console.log('Key type:', typeof data.vapidPublicKey);
      
      if (data.vapidPublicKey) {
        // Test with direct key from env
        const expectedKey = "BMyzdlOHwQj3OTmcbPRvigr2AbPEHGhBdsPxcad6OKyleO-9vxN1bhiqdFBu4_zKdqy_T1t93In6x-Kq6jMVKu8";
        console.log('Expected key:', expectedKey);
        console.log('Keys match:', data.vapidPublicKey === expectedKey);
        
        // Test multiple methods
        const methods = await testVapidKeyMethods(data.vapidPublicKey);
        console.log('Method test results:', methods);
        
        try {
          const converted = urlBase64ToUint8Array(data.vapidPublicKey);
          console.log('Converted successfully:', converted.length, 'bytes');
          setTestResult(`✅ VAPID key is valid (${converted.length} bytes)`);
        } catch (error) {
          console.error('Standard conversion failed:', error);
          setTestResult(`❌ Standard conversion failed. Method results: ${JSON.stringify(methods)}`);
        }
      } else {
        setTestResult('❌ No VAPID key found');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">VAPID Key Test</h3>
      <button 
        onClick={testVapidKey}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test VAPID Key
      </button>
      {testResult && (
        <p className="mt-2 text-sm">{testResult}</p>
      )}
    </div>
  );
}