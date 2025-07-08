// Alternative VAPID key conversion using different methods
export function urlBase64ToUint8ArrayAlternative(base64String: string): Uint8Array {
  try {
    console.log('Using alternative conversion method');
    console.log('Original key:', base64String);
    console.log('Key length:', base64String.length);
    
    // Method 1: Direct TextEncoder approach
    const textEncoder = new TextEncoder();
    const decoded = textEncoder.encode(base64String);
    console.log('TextEncoder result length:', decoded.length);
    
    if (decoded.length === 65) {
      return decoded;
    }
    
    // Method 2: Manual base64url decoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    let buffer = 0;
    let bitsAccumulated = 0;
    
    for (let i = 0; i < base64String.length; i++) {
      const char = base64String[i];
      const value = chars.indexOf(char);
      
      if (value === -1) continue;
      
      buffer = (buffer << 6) | value;
      bitsAccumulated += 6;
      
      if (bitsAccumulated >= 8) {
        result += String.fromCharCode((buffer >> (bitsAccumulated - 8)) & 0xFF);
        bitsAccumulated -= 8;
      }
    }
    
    const outputArray = new Uint8Array(result.length);
    for (let i = 0; i < result.length; i++) {
      outputArray[i] = result.charCodeAt(i);
    }
    
    console.log('Manual decode result length:', outputArray.length);
    
    if (outputArray.length === 65) {
      return outputArray;
    }
    
    throw new Error('Unable to decode VAPID key to 65 bytes');
  } catch (error) {
    console.error('Alternative conversion failed:', error);
    throw error;
  }
}

// Test function to compare methods
export async function testVapidKeyMethods(base64String: string) {
  const methods = [];
  
  // Method 1: Standard base64url decode
  try {
    const cleanBase64 = base64String.trim();
    let base64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    methods.push({ method: 'atob', length: outputArray.length, success: true });
  } catch (error) {
    methods.push({ method: 'atob', error: error.message, success: false });
  }
  
  // Method 2: Alternative approach
  try {
    const result = urlBase64ToUint8ArrayAlternative(base64String);
    methods.push({ method: 'alternative', length: result.length, success: true });
  } catch (error) {
    methods.push({ method: 'alternative', error: error.message, success: false });
  }
  
  return methods;
}