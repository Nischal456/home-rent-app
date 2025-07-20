import Notification from "@/models/Notification";
import { Types } from "mongoose"; // 1. Change import from Schema to Types

export const createNotification = async (
    userId: Types.ObjectId, // 2. Change the type here
    title: string,
    message: string,
    link?: string
) => {
    try {
        const notification = new Notification({ userId, title, message, link });
        await notification.save();
    } catch (error) {
        console.error("Failed to create notification:", error);
    }
};