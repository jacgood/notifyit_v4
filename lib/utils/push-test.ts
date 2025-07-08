// Utility to test push notification functionality
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  try {
    console.log('Original key:', base64String);
    console.log('Key length:', base64String.length);
    
    // Remove any whitespace
    const cleanBase64 = base64String.trim();
    
    // Convert base64url to base64
    let base64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed (base64 strings should be multiples of 4)
    while (base64.length % 4) {
      base64 += '=';
    }
    
    console.log('After padding and replacement:', base64);
    console.log('Base64 length:', base64.length);

    // Decode using atob
    const rawData = window.atob(base64);
    console.log('atob result length:', rawData.length);
    
    // Convert to Uint8Array
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    console.log('Final array length:', outputArray.length);
    console.log('First few bytes:', Array.from(outputArray.slice(0, 10)));
    
    // Verify length for VAPID key (should be 65 bytes)
    if (outputArray.length !== 65) {
      throw new Error(`Invalid VAPID key length: ${outputArray.length} bytes, expected 65`);
    }
    
    return outputArray;
  } catch (error) {
    console.error('Failed to decode VAPID key:', error);
    console.error('Error details:', error);
    throw new Error(`Invalid VAPID key format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testPushNotification() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push messaging is not supported');
  }

  // Check if notification permission is granted
  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  // Get service worker registration
  const registration = await navigator.serviceWorker.ready;
  
  // Check if already subscribed
  const existingSubscription = await registration.pushManager.getSubscription();
  
  if (existingSubscription) {
    console.log('Already subscribed to push notifications');
    return existingSubscription;
  }

  return null;
}