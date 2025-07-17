import { Schema, model, models, Document, Model } from 'mongoose';

export interface INotification extends Document {
  _id: string; // Explicitly adding _id for better client-side type inference
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  link: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Notification: Model<INotification> = models.Notification || model<INotification>('Notification', NotificationSchema);

export default Notification;
