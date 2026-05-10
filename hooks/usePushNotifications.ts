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
        alert('আপনার ব্রাউজার নোটিফিকেশন সাপোর্ট করে না।');
        return false;
      }

      let permission = Notification.permission;
      
      const handlePermission = async (perm: NotificationPermission) => {
        setPermission(perm);
        if (perm === 'granted') {
          try {
            const messaging = await initMessaging();
            if (messaging) {
              const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
              if (currentToken) {
                setToken(currentToken);
                if (userId) {
                  await set(ref(database, `users/${userId}/fcmToken`), currentToken);
                }
                return true;
              }
            }
          } catch (e) {
            console.error('Messaging token error:', e);
            // Ignore token error so the UI still records granted
          }
        } else {
          alert('নোটিফিকেশন পারমিশন দেওয়া হয়নি। ব্রাউজার সেটিংস চেক করুন।');
        }
        return false;
      };

      const promise = Notification.requestPermission(handlePermission);
      if (promise && typeof (promise as any).then === 'function') {
        permission = await promise;
        return handlePermission(permission);
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('একটি সমস্যা হয়েছে। এটি যদি কাজ না করে, তবে ব্রাউজারের নতুন ট্যাবে ওপেন করে ট্রাই করুন।');
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
