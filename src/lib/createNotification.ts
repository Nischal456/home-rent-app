import Notification from "@/models/Notification";
import User from "@/models/User";
import { Types } from "mongoose";
import webpush from "web-push";

// Configure web-push with VAPID keys statically
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@stgtower.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export const createNotification = async (
    userId: Types.ObjectId,
    title: string,
    message: string,
    link?: string,
    type: 'GENERAL' | 'ALERT' | 'IMPORTANT' | 'PAYMENT' | 'MAINTENANCE' = 'GENERAL'
) => {
    try {
        const notification = new Notification({ userId, title, message, link, type });
        await notification.save();

        // NATIVE BACKGROUND PUSH LOGIC
        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            const user = await User.findById(userId).select('pushSubscriptions');
            if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
                const payload = JSON.stringify({
                    title,
                    message,
                    link,
                    type
                });

                // Dispatch to all active endpoints for this user array
                const notificationsPromise = user.pushSubscriptions.map((sub: any) => 
                    webpush.sendNotification(sub, payload).catch(err => {
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            // The subscription is expired or invalid on the client device.
                            // We should optionally pull it securely.
                            console.log("Subscription expired:", sub.endpoint);
                        } else {
                            console.error("Web Push Send Error:", err);
                        }
                    })
                );
                
                await Promise.all(notificationsPromise);
            }
        }

    } catch (error) {
        console.error("Failed to create/send notification:", error);
    }
};