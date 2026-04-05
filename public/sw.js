// public/sw.js

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        
        const options = {
            body: data.message || "You have a new notification",
            icon: '/home.png',
            badge: '/home.png',
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            data: {
                url: data.link || '/dashboard'
            },
            requireInteraction: true // Keep notification on screen until user interacts
        };

        event.waitUntil(
            self.registration.showNotification(data.title || "STG Tower", options)
        );
    } catch (e) {
        console.error("Push Event Error: ", e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If completely closed, open a new window
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
