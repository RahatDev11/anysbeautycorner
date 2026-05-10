import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { initMessaging } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';

const VAPID_KEY = 'YJmRy7RwHDamT_Wq9GSpJQm3Iexnkq1K9zvRFu3H_oI';

export function usePushNotifications(userId?: string) {
  const [token, setToken] = useState<string | null>(null);
  const [permissionUrl, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
      }

      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const messaging = await initMessaging();
        if (messaging) {
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (currentToken) {
            setToken(currentToken);
            // Save token to DB if user is provided
            if (userId) {
              await set(ref(database, `users/${userId}/fcmToken`), currentToken);
            }
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  useEffect(() => {
    const setupOnMessage = async () => {
      const messaging = await initMessaging();
      if (messaging) {
        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          // Show foreground notification using native API
          if (Notification.permission === 'granted' && payload.notification) {
            new Notification(payload.notification.title || 'Notification', {
              body: payload.notification.body,
              icon: '/logo.png',
            });
          }
        });
      }
    };
    if (permissionUrl === 'granted') {
      setupOnMessage();
    }
  }, [permissionUrl]);

  return { token, permission: permissionUrl, requestPermission };
}
