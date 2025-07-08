import webpush from 'web-push';

// Get VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

// Function to configure web-push
function configureWebPush() {
  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
      vapidEmail,
      vapidPublicKey,
      vapidPrivateKey
    );
  }
}

export { webpush, vapidPublicKey, configureWebPush };

export interface PushNotificationPayload {
  title: string;
  body: string;
  alertId?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushNotificationPayload
): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping push notification');
    return;
  }

  // Configure web-push with VAPID details
  configureWebPush();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        tag: payload.tag || 'voicemail-alert',
        alertId: payload.alertId,
        timestamp: Date.now(),
        ...payload.data
      })
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}