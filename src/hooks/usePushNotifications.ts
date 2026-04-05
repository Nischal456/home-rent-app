'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermissionState(Notification.permission);
      // Register service worker immediately for intercepting events
      navigator.serviceWorker.register('/sw.js').then(reg => {
          reg.pushManager.getSubscription().then(sub => {
              if (sub) setIsSubscribed(true);
          });
      }).catch(err => console.error("SW Registration failed:", err));
    }
  }, []);

  const subscribeToPush = async () => {
    if (!isSupported) {
        toast.error("Push notifications are not supported on this browser.");
        return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      
      if (permission !== 'granted') {
          toast.info("Notification permission was denied.");
          return;
      }

      const registration = await navigator.serviceWorker.ready;

      // Unsubscribe if already subscribed to prevent stale tokens
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
          await existingSub.unsubscribe();
      }

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
          toast.error("VAPID Configuration missing on client.");
          return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });

      // Send to server
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
          throw new Error('Failed to save subscription on server');
      }

      setIsSubscribed(true);
      toast.success("Successfully enabled native push notifications!", { icon: '🔔' });

    } catch (error) {
      console.error('Push Subscription Error:', error);
      toast.error("Failed to enable push notifications.");
    }
  };

  return {
    isSupported,
    isSubscribed,
    permissionState,
    subscribeToPush
  };
}
