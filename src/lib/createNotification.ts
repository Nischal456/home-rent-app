import Notification from "@/models/Notification";
import { Schema } from "mongoose";

export const createNotification = async (
    userId: Schema.Types.ObjectId,
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
